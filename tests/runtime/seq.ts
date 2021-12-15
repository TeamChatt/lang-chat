import test from 'ava'
import { testProgram, testRuntime } from '../helpers'
import { Prog, Cmd } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Exec({ fn: 'exec-1', args: [] }),
    Cmd.Exec({ fn: 'exec-2', args: [] }),
    Cmd.Exec({ fn: 'exec-3', args: [] }),
    Cmd.Exec({ fn: 'exec-4', args: [] }),
  ],
}

const expectedOutput = [
  { fn: 'exec-1', args: [] },
  { fn: 'exec-2', args: [] },
  { fn: 'exec-3', args: [] },
  { fn: 'exec-4', args: [] },
]

test('run seq', testProgram, program, expectedOutput)

test('resume seq', testRuntime, program, expectedOutput)
