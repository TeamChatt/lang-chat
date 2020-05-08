import { Prog, Cmd, Expr } from '../ast'

export const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Cmds([
        Cmd.Exec({ fn: 'exec-1', args: [] }),
        Cmd.Exec({ fn: 'exec-2', args: [] }),
      ]),
    }),
    Cmd.Run(Expr.Var('start')),
  ],
}
