// Utility types
type Limit<T, Keys extends string> = {
  [P in keyof T]: P extends Keys ? T[P] : never
}

type FuncsOnly<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any ? T[P] : never
}

// Handler types
type OfUnion<T extends { kind: string }> = {
  [P in T['kind']]: Extract<T, { kind: P }>
}

type Handler<T, U = any> = {
  [P in keyof T]: (variant: T[P]) => U
}

type WithDefault<T, U = any> = Partial<T> & {
  default: (...args: Parameters<FuncsOnly<T>[keyof T]>) => U
}

// Handle all cases
export const match = <
  T extends { kind: string },
  H extends Handler<OfUnion<T>>
>(
  obj: T,
  handler: H
): ReturnType<H[keyof H]> => handler[obj.kind](obj)

// Handle cases with a catch-all 'default'
export const matchOr = <
  T extends { kind: string },
  H extends WithDefault<Handler<OfUnion<T>>>
>(
  obj: T,
  handler: H
): ReturnType<Limit<FuncsOnly<H>, T['kind'] | 'default'>[keyof H]> => {
  if (obj.kind in handler) {
    return handler[obj.kind](obj)
  } else {
    return (handler as { default(t: T): any }).default(obj)
  }
}
