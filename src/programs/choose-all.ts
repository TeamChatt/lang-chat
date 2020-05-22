import { Prog, Branch, Cmd, Expr } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.ChooseAll([
      Branch.Choice({
        label: 'first',
        cmdExpr: Expr.Cmd(Cmd.Exec({ fn: 'exec-first', args: [] })),
      }),
      Branch.Choice({
        label: 'second',
        cmdExpr: Expr.Cmd(Cmd.Exec({ fn: 'exec-second', args: [] })),
      }),
      Branch.Choice({
        label: 'third',
        cmdExpr: Expr.Cmd(Cmd.Exec({ fn: 'exec-third', args: [] })),
      }),
    ]),
  ],
}
