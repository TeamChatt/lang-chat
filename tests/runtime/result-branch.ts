import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Result(
        Expr.Cmd(
          Cmd.ChooseOne([
            Branch.Choice({
              label: 'first',
              cmdExpr: Expr.Cmd(Cmd.Return(Expr.Lit('branch-1'))),
            }),
            Branch.Choice({
              label: 'second',
              cmdExpr: Expr.Cmd(Cmd.Exec({ fn: 'branch-2', args: [] })),
            }),
          ])
        )
      ),
    }),
    Cmd.Exec({
      fn: 'command',
      args: [Expr.Var('start')],
    }),
  ],
}

const expectedOutput = [
  { index: 0, label: 'first' },
  { fn: 'command', args: ['"branch-1"'] },
]

test('run result-branch', testProgram, program, expectedOutput)
