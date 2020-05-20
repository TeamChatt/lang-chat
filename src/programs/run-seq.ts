import { Prog, Cmd, Expr } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'label',
      value: Expr.Cmds([Cmd.Exec({ fn: 'exec', args: [] })]),
    }),
    Cmd.Run(Expr.Var('label')),
    Cmd.Run(Expr.Var('label')),
    Cmd.Run(Expr.Var('label')),
  ],
}

export const expectedOutput = ['exec', 'exec', 'exec']
