import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const source = `let x = !(-3 + 2 * 5 >= 15) && 4 - 3 == 1`
const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'x',
      value: Expr.Binary({
        exprLeft: Expr.Unary({
          op: '!',
          expr: Expr.Paren(
            Expr.Binary({
              exprLeft: Expr.Binary({
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
              op: '>=',
              exprRight: Expr.Lit(15),
            })
          ),
        }),
        op: '&&',
        exprRight: Expr.Binary({
          exprLeft: Expr.Binary({
            exprLeft: Expr.Lit(4),
            op: '-',
            exprRight: Expr.Lit(3),
          }),
          op: '==',
          exprRight: Expr.Lit(1),
        }),
      }),
    }),
  ],
}

test('parse ops', testParse, source, program)
