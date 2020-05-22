const match = <T>(
  obj: { kind: string },
  cases: { [key: string]: (obj: any) => T }
) => cases[obj.kind](obj)

export default match
