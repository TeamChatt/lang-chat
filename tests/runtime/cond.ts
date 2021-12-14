import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

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

const expectedOutput = [{ fn: 'exec-true', args: [] }]

test('run cond', testProgram, program, expectedOutput)
