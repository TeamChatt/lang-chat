import test from 'ava'
import { testProgram, testRuntime } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Result(Expr.Cmd(Cmd.Exec({ fn: 'eval-1', args: [] }))),
    }),
    Cmd.Exec({
      fn: 'command',
      args: [Expr.Var('start')],
    }),
  ],
}

const expectedOutput = [
  { fn: 'eval-1', args: [] },
  { fn: 'command', args: ['{"fn":"eval-1","args":[]}'] },
]

test('run result', testProgram, program, expectedOutput)

test('resume result', testRuntime, program, expectedOutput)
