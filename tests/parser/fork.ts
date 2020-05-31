import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr, Branch } from '../../src'

const source = `\
fork-all
  branch do
    exec("exec-branch-1")
    exec("exec-branch-1")
  branch do
    exec("exec-branch-2")
    exec("exec-branch-2")
`
const program: Prog = {
  commands: [
    Cmd.ForkAll([
      Branch.Fork(
        Expr.Cmds([
          Cmd.Exec({ fn: 'exec-branch-1', args: [] }),
          Cmd.Exec({ fn: 'exec-branch-1', args: [] }),
        ])
      ),
      Branch.Fork(
        Expr.Cmds([
          Cmd.Exec({ fn: 'exec-branch-2', args: [] }),
          Cmd.Exec({ fn: 'exec-branch-2', args: [] }),
        ])
      ),
    ]),
  ],
}

test('parse choice', testParse, source, program)
