import { Macro } from 'ava'
import { Prog } from '../../src/static/ast'
import tagLocation from '../../src/static/tag-location'
import { run } from '../../src/runtime'
import { parse } from '../../src/parser'

export const testDriver = {
  exec: async (fn, args) => {
    return fn
  },
  dialogue: async (character, line) => {
    return line
  },
  branch: async (branches) => {
    return branches[0]
  },
  error: (err) => {
    throw err
  },
}

export const testProgram: Macro<[Prog, string[]]> = (
  t,
  program,
  expectedOutput
) => {
  t.plan(expectedOutput.length)

  // Return an observable
  const io = run(tagLocation(program))
  return io.map(async ([ctx, effect]) => {
    const output = await effect(testDriver)
    const expected = expectedOutput.shift()
    t.is(output, expected)
  })
}

export const testParse: Macro<[string, Prog]> = (
  t,
  programSource: string,
  expectedOutput: Prog
) => {
  const output = parse(programSource)
  t.deepEqual(output, expectedOutput)
}
