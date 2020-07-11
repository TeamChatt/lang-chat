import { Type, unify } from './types'
import { TryState } from '../monad/try-state'
import {
  TypeContext,
  defineVar as defineVarContext,
  lookupVar as lookupVarContext,
  pushStack as pushStackContext,
  popStack as popStackContext,
  pushLocation as pushLocationContext,
  popLocation as popLocationContext,
} from './type-context'
import { bestMatches } from '../util/edit-distance'
import { Loc } from './location'

export type TypeChecker<T> = TryState<TypeContext, T>

export class TypeError extends Error {
  readonly loc: Loc
  constructor(reason: string, loc: Loc) {
    super(reason)
    this.loc = loc
  }
}

export const pure = <T>(v: T): TypeChecker<T> => TryState.of(v)
export const fail = <T>(reason: string): TypeChecker<T> =>
  TryState.get<TypeContext>().flatMap((ctx) => {
    const loc = ctx.locs[0]
    return TryState.fail(new TypeError(reason, loc))
  })

// Error messages
export const typeMismatch = <T>(
  expectedType: Type,
  actualType: Type
): TypeChecker<T> =>
  fail(`Expected type ${expectedType}, but found ${actualType}`)

export const variableNotDefined = <T>(variable: string): TypeChecker<T> =>
  TryState.get<TypeContext>()
    .map((context) => Object.keys(context.bindings))
    .flatMap((variablesInScope) => {
      const suggestions = bestMatches(variable, variablesInScope)
      return suggestions.length === 0
        ? fail(`Variable "${variable}" not defined.`)
        : fail(
            `Variable "${variable}" not defined. Did you mean "${formatAlternatives(
              suggestions
            )}"?`
          )
    })
const formatAlternatives = (words: string[]): string =>
  words.length === 1
    ? words[0]
    : `${words.slice(0, -1).join(', ')}, or ${words[words.length - 1]}`

// Variables and Scope
const pushStack = (): TypeChecker<undefined> =>
  TryState.modify(pushStackContext)

const popStack = (): TypeChecker<undefined> => TryState.modify(popStackContext)

export const scoped = <T>(m: TypeChecker<T>): TypeChecker<T> =>
  pushStack().flatMap(() => m.flatMap((mInner) => popStack().map(() => mInner)))

const pushLocation = (loc: Loc): TypeChecker<undefined> =>
  TryState.modify(pushLocationContext(loc))
const popLocation = (): TypeChecker<undefined> =>
  TryState.modify(popLocationContext)

export const withLocation = <T>(loc: Loc, m: TypeChecker<T>): TypeChecker<T> =>
  pushLocation(loc).flatMap(() =>
    m.flatMap((mInner) => popLocation().map(() => mInner))
  )

export const lookupVar = (variable: string): TypeChecker<Type> =>
  TryState.get<TypeContext>().flatMap((ctx) =>
    lookupVarContext(variable)(ctx).maybe(
      (type) => pure(type),
      () => variableNotDefined(variable)
    )
  )

export const defineVar = (
  variable: string,
  type: Type
): TypeChecker<undefined> => TryState.modify(defineVarContext(variable, type))

export const expectType = (expected: Type) => (
  actual: Type
): TypeChecker<Type> =>
  unify(expected, actual).maybe<TypeChecker<Type>>(
    (unified) => pure(unified),
    () => typeMismatch(expected, actual)
  )

export const unifyVar = (variable: string, type: Type): TypeChecker<Type> =>
  lookupVar(variable)
    .flatMap(expectType(type))
    .flatMap((unified) =>
      defineVar(variable, unified).flatMap(() => pure(unified))
    )

// Utility
export const sequenceM = <T>(arrM: TypeChecker<T>[]): TypeChecker<T[]> =>
  arrM.reduce(
    (p, q) => p.flatMap((pInner) => q.map((qInner) => [...pInner, qInner])),
    pure([] as T[])
  )
