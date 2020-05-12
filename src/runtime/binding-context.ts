import { Result } from './interpreter'

export interface BindingContext {
  [variable: string]: Result
}

export const empty: BindingContext = {}

export const defineVar = (variable: string, value: Result) => (
  ctx: BindingContext
): BindingContext => ({ ...ctx, [variable]: value })

//TODO: return a maybe
export const lookupVar = (variable: string) => (ctx: BindingContext): Result =>
  ctx[variable]
