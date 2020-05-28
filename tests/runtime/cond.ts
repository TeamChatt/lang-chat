import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.Run(
      Expr.Cond([
        Branch.Cond({
          condition: Expr.Lit(true),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-true', args: [] })),
        }),
        Branch.Cond({
          condition: Expr.Lit(false),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-false', args: [] })),
        }),
      ])
    ),
  ],
}

const expectedOutput = ['exec-true']

test('run cond', testProgram, program, expectedOutput)
