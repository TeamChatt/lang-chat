import { Prog, Branch, Cmd, Expr } from '../../src'

export const program: Prog = {
  commands: [
    Cmd.ChooseAll([
      Branch.Choice({
        label: 'first',
        cmdExpr: Expr.Cmds([Cmd.Exec({ fn: 'exec-first', args: [] })]),
      }),
      Branch.Choice({
        label: 'second',
        cmdExpr: Expr.Cmds([
          Cmd.Exec({ fn: 'exec-second', args: [] }),
          Cmd.Exec({ fn: 'exec-second', args: [] }),
        ]),
      }),
      Branch.Choice({
        label: 'third',
        cmdExpr: Expr.Cmds([
          Cmd.Exec({ fn: 'exec-third', args: [] }),
          Cmd.Exec({ fn: 'exec-third', args: [] }),
          Cmd.Exec({ fn: 'exec-third', args: [] }),
        ]),
      }),
    ]),
  ],
}
