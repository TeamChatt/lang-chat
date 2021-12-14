import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

const source = `\
let x = run exec("fn")
let y = run choose
  choice "choice1" do
    return x
  choice "choice2" do
    return "2"
`
const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'x',
      value: Expr.Result(Expr.Cmd(Cmd.Exec({ fn: 'fn', args: [] }))),
    }),
    Cmd.Def({
      variable: 'y',
      value: Expr.Result(
        Expr.Cmd(
          Cmd.ChooseOne([
            Branch.Choice({
              label: 'choice1',
              cmdExpr: Expr.Cmds([Cmd.Return(Expr.Var('x'))]),
            }),
            Branch.Choice({
              label: 'choice2',
              cmdExpr: Expr.Cmds([Cmd.Return(Expr.Lit('2'))]),
            }),
          ])
        )
      ),
    }),
  ],
}

test('parse result', testParse, source, program)
