import { Maybe } from '../monad/maybe'

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
// TODO: replace output with type (Type | Error(Message))?
export const unifyTypes = (types: Type[]): Maybe<Type> => Maybe.nothing()
