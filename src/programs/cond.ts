import { Prog, Cmd, Expr, Branch } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.Run(
      Expr.Cond([
        Branch.Cond({
          condition: Expr.Lit(true),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-true', args: [] })),
        }),
        Branch.Cond({
          condition: Expr.Lit(false),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-false', args: [] })),
        }),
      ])
    ),
  ],
}

export const expectedOutput = ['exec-true']
