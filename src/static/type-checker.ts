import { Type } from './types'
import { TryState } from '../monad/try-state'
import {
  TypeContext,
  defineVar as defineVarContext,
  lookupVar as lookupVarContext,
  pushStack as pushStackContext,
  popStack as popStackContext,
} from './type-context'

export type TypeChecker<T> = TryState<TypeContext, T>

export class TypeError extends Error {}

export const pure = <T>(v: T): TypeChecker<T> => TryState.of(v)
export const fail = <T>(reason: string): TypeChecker<T> =>
  TryState.fail(new TypeError(reason))

const pushStack = (): TypeChecker<undefined> =>
  TryState.modify(pushStackContext)

const popStack = (): TypeChecker<undefined> => TryState.modify(popStackContext)

export const scoped = <T>(m: TypeChecker<T>): TypeChecker<T> =>
  pushStack().flatMap(() => m.flatMap((mInner) => popStack().map(() => mInner)))

export const lookupVar = (variable: string): TypeChecker<Type> =>
  TryState.get<TypeContext>().flatMap((ctx) =>
    lookupVarContext(variable)(ctx).maybe(
      (type) => pure(type),
      () => fail('Variable not in scope')
    )
  )

export const defineVar = (
  variable: string,
  type: Type
): TypeChecker<undefined> => TryState.modify(defineVarContext(variable, type))

export const sequenceM = <T>(arrM: TypeChecker<T>[]): TypeChecker<T[]> =>
  arrM.reduce(
    (p, q) => p.flatMap((pInner) => q.map((qInner) => [...pInner, qInner])),
    pure([] as T[])
  )
