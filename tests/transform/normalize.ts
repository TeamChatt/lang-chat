import test from 'ava'
import { Prog, Cmd, Expr, normalize } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Exec({
      fn: 'outer',
      args: [Expr.Result(Expr.Cmd(Cmd.Exec({ fn: 'inner', args: [] })))],
    }),
  ],
}
const expected: Prog = {
  commands: [
    Cmd.Def({
      variable: '__temp__0',
      value: Expr.Result(Expr.Cmd(Cmd.Exec({ fn: 'inner', args: [] }))),
    }),
    Cmd.Exec({
      fn: 'outer',
      args: [Expr.Var('__temp__0')],
    }),
  ],
}

test('normalize AST', (t) => {
  const transformed = normalize(program)
  t.deepEqual(transformed, expected)
})
