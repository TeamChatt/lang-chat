import { Prog, Cmd, Expr } from '../../src'

export const program: Prog = {
  commands: [
    Cmd.Run(
      Expr.Cmds([
        Cmd.Def({ variable: 'one', value: Expr.Lit(1) }),
        Cmd.Exec({ fn: 'exec-1', args: [Expr.Var('one')] }),
      ])
    ),
    Cmd.Run(
      Expr.Cmds([
        Cmd.Def({ variable: 'two', value: Expr.Lit(2) }),
        Cmd.Exec({ fn: 'exec-2', args: [Expr.Var('two')] }),
      ])
    ),
  ],
}
