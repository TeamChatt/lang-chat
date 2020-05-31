import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

const source = `\
run cond
  case true -> do
    exec("exec-true")
    exec("exec-true")
  case false -> exec("exec-false")
`
const program: Prog = {
  commands: [
    Cmd.Run(
      Expr.Cond([
        Branch.Cond({
          condition: Expr.Lit(true),
          result: Expr.Cmds([
            Cmd.Exec({ fn: 'exec-true', args: [] }),
            Cmd.Exec({ fn: 'exec-true', args: [] }),
          ]),
        }),
        Branch.Cond({
          condition: Expr.Lit(false),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-false', args: [] })),
        }),
      ])
    ),
  ],
}

test('parse cond', testParse, source, program)
