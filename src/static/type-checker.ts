import { Type } from './types'

export class TypeChecker<T> {
  static of<T>(t: T): TypeChecker<T> {
    return {} as TypeChecker<T>
  }
  static fail(err): TypeChecker<undefined> {
    return {} as TypeChecker<undefined>
  }

  // Can be written in terms of state monad??
  map<T2>(f: (t: T) => T2): TypeChecker<T2> {
    return {} as TypeChecker<T2>
  }

  flatten<T2>(): TypeChecker<T2> {
    return {} as TypeChecker<T2>
  }

  flatMap<T2>(f: (t: T) => TypeChecker<T2>): TypeChecker<T2> {
    return this.map(f).flatten()
  }
}

const pushStack = (): TypeChecker<undefined> => {
  return {} as TypeChecker<undefined>
}

const popStack = (): TypeChecker<undefined> => {
  return {} as TypeChecker<undefined>
}

export const scoped = <T>(m: TypeChecker<T>): TypeChecker<T> =>
  pushStack().flatMap(() => m.flatMap((mInner) => popStack().map(() => mInner)))

export const sequenceM = <T>(arrM: TypeChecker<T>[]): TypeChecker<T[]> =>
  arrM.reduce(
    (p, q) => p.flatMap((pInner) => q.map((qInner) => [...pInner, qInner])),
    TypeChecker.of([] as T[])
  )

export const lookupVar = (variable: string): TypeChecker<Type> => {
  //TODO: lookup variable in context. Throw if not in scope
  return {} as TypeChecker<Type>
}
export const defineVar = (
  variable: string,
  type: Type
): TypeChecker<undefined> => {
  return {} as TypeChecker<undefined>
}
