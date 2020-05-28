import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'label',
      value: Expr.Cmds([Cmd.Exec({ fn: 'exec', args: [] })]),
    }),
    Cmd.Run(Expr.Var('label')),
    Cmd.Run(Expr.Var('label')),
    Cmd.Run(Expr.Var('label')),
  ],
}

const expectedOutput = ['exec', 'exec', 'exec']

test('run run-seq', testProgram, program, expectedOutput)
