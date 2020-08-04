import { Prog, Cmd, Expr } from '../../src'

export const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('Haikus are fun') }),
    Cmd.Dialogue({
      character: 'Alice',
      line: Expr.Lit("But sometimes they don't make sense"),
    }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('Refrigerator') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('How much can I fit') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('into a haiku format') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit("oh no I'm out of") }),
  ],
}
