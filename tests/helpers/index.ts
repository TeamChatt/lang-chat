import { Macro } from 'ava'
import { Prog, tagLocation, run, parse, Driver } from '../../src'

export const testDriver: Driver = {
  exec: async (fn, args) => {
    return [fn, ...args.map((arg) => JSON.stringify(arg))].join(' ')
  },
  eval: async (fn, args) => {
    return [fn, ...args.map((arg) => JSON.stringify(arg))].join(' ')
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

const getOutput = (r) => (r && r.kind === 'Result.Lit' ? r.value : r)

export const testProgram: Macro<[Prog, string[]]> = (
  t,
  program,
  expectedOutput
) => {
  t.plan(expectedOutput.length)

  // Return an observable
  const io = run(tagLocation(program))
  return io.map(async ([effect, ctx]) => {
    const output = getOutput(await effect(testDriver))
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
