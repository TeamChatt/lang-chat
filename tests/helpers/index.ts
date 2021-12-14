import { Macro } from 'ava'
import { Prog, tagLocation, run, parse, Driver } from '../../src'

export const testDriver: Driver = {
  exec: async (fn, args): Promise<ExecEffect> => {
    return { fn, args: args.map((arg) => JSON.stringify(arg)) }
  },
  dialogue: async (character, line): Promise<DialogueEffect> => {
    return { character, line }
  },
  branch: async (branches: BranchEffect[]): Promise<BranchEffect> => {
    return branches[0]
  },
  error: (err) => {
    throw err
  },
}

const getOutput = (r) => (r && r.kind === 'Result.Lit' ? r.value : r)

type DialogueEffect = { character: string; line: string }
type ExecEffect = { fn: string; args: string[] }
type BranchEffect = { index: number; label: string }
type OutputEffect = DialogueEffect | ExecEffect | BranchEffect

export const testProgram: Macro<[Prog, OutputEffect[]]> = (
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
    t.deepEqual(output, expected)
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
