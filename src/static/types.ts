import { Maybe } from '../data/maybe'

export type Type =
  | 'Type.Any'
  | 'Type.String'
  | 'Type.Cmd'
  | 'Type.Number'
  | 'Type.Bool'
export const Type = {
  Any: 'Type.Any' as Type,
  Cmd: 'Type.Cmd' as Type,
  String: 'Type.String' as Type,
  Number: 'Type.Number' as Type,
  Bool: 'Type.Bool' as Type,
}

export const literalType = (lit: any): Type => {
  switch (typeof lit) {
    case 'string':
      return Type.String
    case 'number':
      return Type.Number
    case 'boolean':
      return Type.Bool
  }
}

export const unify = (t1: Type, t2: Type): Maybe<Type> => {
  if (t1 === 'Type.Any') return Maybe.just(t2)
  if (t2 === 'Type.Any') return Maybe.just(t1)
  return t1 === t2 ? Maybe.just(t1) : Maybe.nothing()
}

export const unifyTypes = (types: Type[]): Maybe<Type> =>
  types.length === 0
    ? Maybe.nothing()
    : types.reduce(
        (acc, t) => acc.flatMap((t2) => unify(t, t2)),
        Maybe.just(types[0])
      )
