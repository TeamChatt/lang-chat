import { Maybe } from '../data/maybe'

export type Type = TAny | TUnit | TString | TNumber | TBool | TCmd
interface TAny {
  kind: 'Type.Any'
}
interface TUnit {
  kind: 'Type.Unit'
}
interface TString {
  kind: 'Type.String'
}
interface TNumber {
  kind: 'Type.Number'
}
interface TBool {
  kind: 'Type.Bool'
}
interface TCmd {
  kind: 'Type.Cmd'
  resultType: Type
}

export const Type = {
  Any: { kind: 'Type.Any' } as Type,
  Unit: { kind: 'Type.Unit' } as Type,
  String: { kind: 'Type.String' } as Type,
  Number: { kind: 'Type.Number' } as Type,
  Bool: { kind: 'Type.Bool' } as Type,
  Cmd: (resultType: Type): Type => ({ kind: 'Type.Cmd', resultType }),
}

export const isCmd = (t: Type): t is TCmd => t.kind === 'Type.Cmd'

export const literalType = (lit: any): Type => {
  switch (typeof lit) {
    case 'string':
      return Type.String
    case 'number':
      return Type.Number
    case 'boolean':
      return Type.Bool
    default:
      throw new Error()
  }
}

export const unify = (t1: Type, t2: Type): Maybe<Type> => {
  if (t1.kind === 'Type.Any') return Maybe.just(t2)
  if (t2.kind === 'Type.Any') return Maybe.just(t1)
  if (t1.kind === 'Type.Cmd' && t2.kind === 'Type.Cmd')
    return unify(t1.resultType, t2.resultType).map(Type.Cmd)
  return t1.kind === t2.kind ? Maybe.just(t1) : Maybe.nothing()
}

export const unifyTypes = (types: Type[]): Maybe<Type> =>
  types.length === 0
    ? Maybe.nothing()
    : types.reduce(
        (acc, t) => acc.flatMap((t2) => unify(t, t2)),
        Maybe.just(types[0])
      )
