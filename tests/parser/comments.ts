import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

const source = `\
let name = do
  exec("exec-1")
  // Comment
  exec("exec-2")
  exec("exec-3")

choose
  choice "choice-1" do
    // Comment
    exec("exec-choice-1")
    // Comment
    exec("exec-choice-1")
  choice "choice-2" do
    // Comment
    exec("exec-choice-2")
    exec("exec-choice-2")
`
const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'name',
      value: Expr.Cmds([
        Cmd.Exec({ fn: 'exec-1', args: [] }),
        Cmd.Exec({ fn: 'exec-2', args: [] }),
        Cmd.Exec({ fn: 'exec-3', args: [] }),
      ]),
    }),
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

test('parse comments', testParse, source, program)
