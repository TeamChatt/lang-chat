import { run } from '../../src/runtime'

export const testDriver = {
  exec: async (fn, args) => {
    return fn
  },
  branch: async (branches) => {
    return branches[0]
  },
}

export const testProgram = (t, program, expectedOutput) => {
  t.plan(expectedOutput.length)

  // Return an observable
  const io = run(program)
  return io.map(async ([ctx, effect]) => {
    const output = await effect(testDriver)
    const expected = expectedOutput.shift()
    t.is(output, expected)
  })
}
