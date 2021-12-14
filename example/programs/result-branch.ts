import { Prog, Cmd, Expr, Branch } from '../../src'

export const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Result(
        Expr.Cmd(
          Cmd.ChooseOne([
            Branch.Choice({
              label: 'first',
              cmdExpr: Expr.Cmd(Cmd.Return(Expr.Lit('branch-1'))),
            }),
            Branch.Choice({
              label: 'second',
              cmdExpr: Expr.Cmd(Cmd.Exec({ fn: 'branch-2', args: [] })),
            }),
          ])
        )
      ),
    }),
    Cmd.Exec({
      fn: 'command',
      args: [Expr.Var('start')],
    }),
  ],
}
