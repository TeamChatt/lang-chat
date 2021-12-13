import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

const source = `\
choose
  choice "choice1" do
    let x = 1 + 0
    return x
  choice "choice2" do
    return "2"
`
const program: Prog = {
  commands: [
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'choice1',
        cmdExpr: Expr.Cmds([
          Cmd.Def({
            variable: 'x',
            value: Expr.Binary({
              op: '+',
              exprLeft: Expr.Lit(1),
              exprRight: Expr.Lit(0),
            }),
          }),
          Cmd.Return(Expr.Var('x')),
        ]),
      }),
      Branch.Choice({
        label: 'choice2',
        cmdExpr: Expr.Cmds([Cmd.Return(Expr.Lit('2'))]),
      }),
    ]),
  ],
}

test('parse decl-run', testParse, source, program)
