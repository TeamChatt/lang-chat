import { State } from '../monad/state'
import { Loc, down, up } from './location'

export type ASTContext<T> = State<Loc, T>

const sequenceM = <T>(arrM: ASTContext<T>[]): ASTContext<T[]> =>
  arrM.reduce(
    (arrM, valM) =>
      arrM.flatMap((arr) => valM.flatMap((val) => pure([...arr, val]))),
    pure([] as T[])
  )

// Action creators
export const empty: ASTContext<any> = State.of(null)

export const pure = <T>(v: T): ASTContext<T> => State.of(v)

const pushKey = <T>(key: string): ASTContext<T> => State.modify(down(key))

const popKey = State.modify(up)

export const withKey = <T>(key: string, action: ASTContext<T>): ASTContext<T> =>
  pushKey(key)
    .flatMap(() => action)
    .flatMap((r) => popKey.map(() => r))

export const withArray = <T>(
  key: string,
  actions: ASTContext<T>[]
): ASTContext<T[]> =>
  withKey(key, sequenceM(actions.map((a, i) => withKey(`[${i}]`, a))))

export const readLocation = (): ASTContext<Loc> => State.get()
