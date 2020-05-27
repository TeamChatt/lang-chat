import { Maybe } from '../data/maybe'

export type Type = 'Type.String' | 'Type.Cmd'
export const Type = {
  Cmd: 'Type.Cmd' as Type,
  String: 'Type.String' as Type,
}

export const literalType = (lit: any): Type => {
  switch (typeof lit) {
    case 'string':
      return Type.String
  }
}

const unify = (t1: Type, t2: Type): Maybe<Type> =>
  t1 === t2 ? Maybe.just(t1) : Maybe.nothing()

export const unifyTypes = (types: Type[]): Maybe<Type> =>
  types.length === 0
    ? types.reduce(
        (acc, t) => acc.flatMap((t2) => unify(t, t2)),
        Maybe.just(types[0])
      )
    : Maybe.nothing()
