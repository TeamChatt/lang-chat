import { Maybe } from '../data/maybe'
import {
  BindingContext,
  empty as emptyBindings,
  lookupVar as lookupVarBindings,
  defineVar as defineVarBindings,
} from './binding-context'
import { Type } from './types'

export interface TypeContext {
  bindings: BindingContext<Type>
  stack?: TypeContext
}

export const empty: TypeContext = { bindings: emptyBindings, stack: null }

export const defineVar = (variable: string, value: Type) => (
  ctx: TypeContext
): TypeContext => ({
  bindings: defineVarBindings(variable, value)(ctx.bindings),
  stack: ctx.stack,
})

export const lookupVar = (variable: string) => (
  ctx: TypeContext
): Maybe<Type> => lookupVarBindings<Type>(variable)(ctx.bindings)

export const pushStack = (ctx: TypeContext): TypeContext => ({
  bindings: ctx.bindings,
  stack: ctx,
})

export const popStack = (ctx: TypeContext): TypeContext => ctx.stack
