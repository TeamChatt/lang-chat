import { Maybe } from '../monad/maybe'
import { Type } from './types'

export interface TypeContext {
  [variable: string]: Type
}

export const empty: TypeContext = {}

export const defineVar = (variable: string, value: Type) => (
  ctx: TypeContext
): TypeContext => ({ ...ctx, [variable]: value })

export const lookupVar = (variable: string) => (
  ctx: TypeContext
): Maybe<Type> => Maybe.fromNullable(ctx[variable])
