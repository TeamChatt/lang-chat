export type Loc = string[]

export const empty: Loc = []

export const top: Loc = ['commands']

export const down = (key: string) => (loc: Loc): Loc => [...loc, key]

export const up = (loc: Loc): Loc => loc.slice(0, -1)

export const equals = (loc1: Loc) => (loc2: Loc): boolean =>
  loc1.length == loc2.length && loc1.every((v, i) => loc1[i] === loc2[i])
