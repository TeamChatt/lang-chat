import { Prog, Cmd, Expr } from '../static/ast'

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

export const expectedOutput = ['exec-1', 'exec-2']
