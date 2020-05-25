import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const source = `let start = do
  exec("exec1")
  exec("exec2")
run start
`
const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Cmds([
        Cmd.Exec({ fn: 'exec1', args: [] }),
        Cmd.Exec({ fn: 'exec2', args: [] }),
      ]),
    }),
    Cmd.Run(Expr.Var('start')),
  ],
}

test('decl-run', testParse, source, program)