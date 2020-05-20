import { Prog, Cmd, Expr } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'is-defined',
      value: Expr.Cmds([Cmd.Exec({ fn: 'exec', args: [] })]),
    }),
    Cmd.Run(Expr.Var('is-defined')),
    Cmd.Run(Expr.Var('not-defined')),
  ],
}
