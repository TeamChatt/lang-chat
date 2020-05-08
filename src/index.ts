import { Prog } from './ast'

const program: Prog = {
  commands: [
    {
      kind: 'Cmd.Def',
      variable: 'start',
      value: { kind: 'Expr.Cmds', cmds: [] },
    },
    {
      kind: 'Cmd.Run',
      expr: { kind: 'Expr.Var', variable: 'start' },
    },
  ],
}

console.log(program)
