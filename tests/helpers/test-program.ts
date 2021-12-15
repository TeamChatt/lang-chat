import { ExecutionContext, Macro } from 'ava'
import xs, { Stream } from 'xstream'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'

import { Prog, tagLocation, run, Driver, Output, resume } from '../../src'

type DialogueEffect = { character: string; line: string }
type ExecEffect = { fn: string; args: string[] }
type BranchEffect = { index: number; label: string }
type OutputEffect = DialogueEffect | ExecEffect | BranchEffect

const testDriver: Driver = {
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

const runDriver =
  (driver: Driver) =>
  (stream: Stream<Output>): Stream<OutputEffect> =>
    stream
      .map(([effect, ctx]) => xs.fromPromise<OutputEffect>(effect(driver)))
      .compose(flattenConcurrently)

const assertOutput =
  (t: ExecutionContext<any>, expectedOutput: OutputEffect[]) =>
  (stream: Stream<OutputEffect>): Stream<void> =>
    stream
      .fold((arr, next) => [...arr, next], [] as OutputEffect[])
      .last()
      .map((output) => {
        t.deepEqual(output, expectedOutput)
      })

export const testProgram: Macro<[Prog, OutputEffect[]]> = (
  t,
  program,
  expectedOutput
) => {
  t.plan(1)

  const prog = tagLocation(program)

  return run(prog)
    .compose(runDriver(testDriver))
    .compose(assertOutput(t, expectedOutput))
}

export const testRuntime: Macro<[Prog, OutputEffect[]]> = (
  t,
  program,
  expectedOutput
) => {
  t.plan(expectedOutput.length)

  const prog = tagLocation(program)

  const runAll = (
    runtime: Stream<Output>,
    expectedOutput: OutputEffect[]
  ): Stream<void> => {
    const first = runtime
      .compose(runDriver(testDriver))
      .compose(assertOutput(t, expectedOutput))

    const next = runtime
      .drop(1)
      .take(1)
      .map(([effect, ctx]) =>
        runAll(resume(prog, ctx), expectedOutput.slice(1))
      )
      .flatten()

    return xs.merge(first, next)
  }

  return runAll(run(prog), expectedOutput)
}
