import { Maybe } from '../data/maybe'

export interface BindingContext<T> {
  [variable: string]: T
}

export const empty: BindingContext<any> = {}

export const defineVar = <T>(variable: string, value: T) => (
  ctx: BindingContext<T>
): BindingContext<T> => ({ ...ctx, [variable]: value })

export const lookupVar = <T>(variable: string) => (
  ctx: BindingContext<T>
): Maybe<T> => Maybe.fromNullable(ctx[variable])
