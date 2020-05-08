import { Prog } from '../ast'

export const program: Prog = {
  commands: [
    // Declare a program section called label1
    {
      kind: 'Cmd.Def',
      variable: 'label1',
      value: {
        kind: 'Expr.Cmds',
        cmds: [
          {
            kind: 'Cmd.Exec',
            fn: 'exec-from-top-level',
            args: [],
          },
        ],
      },
    },
    // Declare a program section called label2
    {
      kind: 'Cmd.Def',
      variable: 'label2',
      value: {
        kind: 'Expr.Cmds',
        cmds: [
          // Shadow the global definition of label1
          {
            kind: 'Cmd.Def',
            variable: 'label1',
            value: {
              kind: 'Expr.Cmds',
              cmds: [
                {
                  kind: 'Cmd.Exec',
                  fn: 'exec-from-local',
                  args: [],
                },
              ],
            },
          },
          {
            kind: 'Cmd.Run',
            expr: { kind: 'Expr.Var', variable: 'label1' },
          },
        ],
      },
    },
    {
      kind: 'Cmd.Run',
      expr: { kind: 'Expr.Var', variable: 'label2' },
    },
  ],
}
