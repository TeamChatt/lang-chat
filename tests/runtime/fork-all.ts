import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'fn',
      value: Expr.Cmds([Cmd.Exec({ fn: 'fn', args: [] })]),
    }),
    Cmd.ForkAll([
      Branch.Fork(
        Expr.Cmds([
          Cmd.Run(Expr.Var('fn')),
          Cmd.ForkAll([
            Branch.Fork(Expr.Cmds([Cmd.Run(Expr.Var('fn'))])),
            Branch.Fork(Expr.Cmds([Cmd.Run(Expr.Var('fn'))])),
          ]),
        ])
      ),
    ]),
  ],
}

const expectedOutput = [
  { fn: 'fn', args: [] },
  { fn: 'fn', args: [] },
  { fn: 'fn', args: [] },
]

test('run cond', testProgram, program, expectedOutput)
