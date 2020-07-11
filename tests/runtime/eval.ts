import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Eval({ fn: 'eval-1', args: [] }),
    }),
  ],
}

const expectedOutput = ['eval-1']

test('run eval', testProgram, program, expectedOutput)
