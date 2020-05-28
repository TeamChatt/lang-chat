import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'x',
      value: Expr.Binary({
        exprLeft: Expr.Unary({
          op: '-',
          expr: Expr.Lit(3),
        }),
        op: '+',
        exprRight: Expr.Binary({
          exprLeft: Expr.Lit(2),
          op: '*',
          exprRight: Expr.Lit(5),
        }),
      }),
    }),
    Cmd.Exec({ fn: 'exec', args: [Expr.Var('x')] }),
  ],
}

const expectedOutput = ['exec 7']

test('run run-seq', testProgram, program, expectedOutput)
