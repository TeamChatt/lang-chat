import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const source = `\
let value = eval("function", 1 + 1)
`
const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'value',
      value: Expr.Eval({
        fn: 'function',
        args: [
          Expr.Binary({
            op: '+',
            exprLeft: Expr.Lit(1),
            exprRight: Expr.Lit(1),
          }),
        ],
      }),
    }),
  ],
}

test('parse eval', testParse, source, program)
