import { Prog, Cmd, Expr } from '../../src'

export const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Eval({ fn: 'eval-1', args: [] }),
    }),
    Cmd.Exec({
      fn: 'command',
      args: [Expr.Var('start')],
    }),
  ],
}
