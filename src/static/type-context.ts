import { Maybe } from '../data/maybe'
import {
  BindingContext,
  empty as emptyBindings,
  lookupVar as lookupVarBindings,
  defineVar as defineVarBindings,
} from './binding-context'
import { Type } from './types'
import { Loc } from './location'

export interface TypeContext {
  bindings: BindingContext<Type>
  locs: Loc[]
  stack?: TypeContext
}

export const empty: TypeContext = {
  bindings: emptyBindings,
  stack: null,
  locs: [],
}

export const defineVar = (variable: string, value: Type) => (
  ctx: TypeContext
): TypeContext => ({
  bindings: defineVarBindings(variable, value)(ctx.bindings),
  stack: ctx.stack,
  locs: ctx.locs,
})

export const lookupVar = (variable: string) => (
  ctx: TypeContext
): Maybe<Type> => lookupVarBindings<Type>(variable)(ctx.bindings)

export const pushStack = (ctx: TypeContext): TypeContext => ({
  bindings: ctx.bindings,
  stack: ctx,
  locs: ctx.locs,
})

export const popStack = (ctx: TypeContext): TypeContext => ctx.stack

export const pushLocation = (loc: Loc) => (ctx: TypeContext): TypeContext => ({
  bindings: ctx.bindings,
  stack: ctx.stack,
  locs: [loc, ...ctx.locs],
})

export const popLocation = (ctx: TypeContext): TypeContext => ({
  bindings: ctx.bindings,
  stack: ctx.stack,
  locs: ctx.locs.slice(1),
})
