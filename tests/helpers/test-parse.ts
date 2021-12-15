import { Macro } from 'ava'

import { Prog, parse } from '../../src'

export const testParse: Macro<[string, Prog]> = (
  t,
  programSource: string,
  expectedOutput: Prog
) => {
  const output = parse(programSource)
  t.deepEqual(output, expectedOutput)
}
