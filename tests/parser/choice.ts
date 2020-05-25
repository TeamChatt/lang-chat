import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src/static/ast'

const source = `choose
  choice "choice-1" do
    exec("exec-choice-1")
    exec("exec-choice-1")
  choice "choice-2" do
    exec("exec-choice-2")
    exec("exec-choice-2")
`
const program: Prog = {
  commands: [
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'choice-1',
        cmdExpr: Expr.Cmds([
          Cmd.Exec({ fn: 'exec-choice-1', args: [] }),
          Cmd.Exec({ fn: 'exec-choice-1', args: [] }),
        ]),
      }),
      Branch.Choice({
        label: 'choice-2',
        cmdExpr: Expr.Cmds([
          Cmd.Exec({ fn: 'exec-choice-2', args: [] }),
          Cmd.Exec({ fn: 'exec-choice-2', args: [] }),
        ]),
      }),
    ]),
  ],
}

test('parse choice', testParse, source, program)
