import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Exec({ fn: 'exec-1', args: [] }),
    Cmd.Exec({ fn: 'exec-2', args: [] }),
    Cmd.Exec({ fn: 'exec-3', args: [] }),
    Cmd.Exec({ fn: 'exec-4', args: [] }),
  ],
}

const expectedOutput = ['exec-1', 'exec-2', 'exec-3', 'exec-4']

test('run seq', testProgram, program, expectedOutput)
