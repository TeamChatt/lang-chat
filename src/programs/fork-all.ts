import { Prog, Branch, Cmd, Expr } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.Exec({ fn: 'top-level-before', args: [] }),
    Cmd.ForkAll([
      Branch.Fork(Expr.Cmds([Cmd.Exec({ fn: 'exec-from-fork-1', args: [] })])),
      Branch.Fork(Expr.Cmds([Cmd.Exec({ fn: 'exec-from-fork-2', args: [] })])),
    ]),
    Cmd.Exec({ fn: 'top-level-after', args: [] }),
  ],
}
