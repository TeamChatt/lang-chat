import { Macro } from 'ava'
import { Prog } from '../../src/static/ast'
import tagLocation from '../../src/static/tag-location'
import { run } from '../../src/runtime'

export const testDriver = {
  exec: async (fn, args) => {
    return fn
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
