import { Prog, Cmd, Expr } from '../static/ast'

export const program: Prog = {
  commands: [
    // Declare a program section called label1
    Cmd.Def({
      variable: 'label1',
      value: Expr.Cmds([Cmd.Exec({ fn: 'exec-from-top-level', args: [] })]),
    }),

    // Declare a program section called label2
    Cmd.Def({
      variable: 'label2',
      value: Expr.Cmds([
        // Shadow the global definition of label1
        Cmd.Def({
          variable: 'label1',
          value: Expr.Cmds([Cmd.Exec({ fn: 'exec-from-local', args: [] })]),
        }),
        Cmd.Run(Expr.Var('label1')),
      ]),
    }),
    Cmd.Run(Expr.Var('label2')),
    Cmd.Run(Expr.Var('label1')),
  ],
}

export const expectedOutput = ['exec-from-local', 'exec-from-top-level']
