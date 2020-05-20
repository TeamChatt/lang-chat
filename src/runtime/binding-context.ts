import { Maybe } from '../monad/maybe'
import { Result } from './interpreter'

export interface BindingContext {
  [variable: string]: Result
}

export const empty: BindingContext = {}

export const defineVar = (variable: string, value: Result) => (
  ctx: BindingContext
): BindingContext => ({ ...ctx, [variable]: value })

export const lookupVar = (variable: string) => (
  ctx: BindingContext
): Maybe<Result> => Maybe.fromNullable(ctx[variable])
