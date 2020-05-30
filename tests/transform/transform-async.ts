import test from 'ava'
import { Prog, Cmd, Expr, Branch, transformM } from '../../src'
import { AsyncIO } from '../../src/monad/async-io'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'import-before',
      value: Expr.Import('before.chat'),
    }),
    Cmd.Run(Expr.Var('import-before')),
    Cmd.Dialogue({ character: 'Alice', line: 'knock knock' }),
    Cmd.Dialogue({ character: 'Bob', line: "who's there?" }),
    Cmd.Dialogue({ character: 'Alice', line: 'lettuce' }),
    Cmd.Dialogue({ character: 'Bob', line: 'lettuce who?' }),
    Cmd.Dialogue({
      character: 'Alice',
      line: "lettuce in, it's cold out here",
    }),
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'laugh',
        cmdExpr: Expr.Cmds([
          Cmd.Dialogue({ character: 'Bob', line: 'haha' }),
          Cmd.Dialogue({ character: 'Bob', line: 'good one' }),
          Cmd.Def({
            variable: 'import-inner',
            value: Expr.Import('inner.chat'),
          }),
          Cmd.Run(Expr.Var('import-inner')),
        ]),
      }),
      Branch.Choice({
        label: 'groan',
        cmdExpr: Expr.Cmds([
          Cmd.Dialogue({ character: 'Bob', line: 'ugh' }),
          Cmd.Dialogue({ character: 'Bob', line: 'terrible' }),
        ]),
      }),
    ]),
    Cmd.Def({
      variable: 'import-after',
      value: Expr.Import('after.chat'),
    }),
    Cmd.Run(Expr.Var('import-after')),
  ],
}
const expected: Prog = {
  commands: [
    Cmd.Def({
      variable: 'import-before',
      value: Expr.Lit('before.chat'),
    }),
    Cmd.Run(Expr.Var('import-before')),
    Cmd.Dialogue({ character: 'Alice', line: 'knock knock' }),
    Cmd.Dialogue({ character: 'Bob', line: "who's there?" }),
    Cmd.Dialogue({ character: 'Alice', line: 'lettuce' }),
    Cmd.Dialogue({ character: 'Bob', line: 'lettuce who?' }),
    Cmd.Dialogue({
      character: 'Alice',
      line: "lettuce in, it's cold out here",
    }),
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'laugh',
        cmdExpr: Expr.Cmds([
          Cmd.Dialogue({ character: 'Bob', line: 'haha' }),
          Cmd.Dialogue({ character: 'Bob', line: 'good one' }),
          Cmd.Def({
            variable: 'import-inner',
            value: Expr.Lit('inner.chat'),
          }),
          Cmd.Run(Expr.Var('import-inner')),
        ]),
      }),
      Branch.Choice({
        label: 'groan',
        cmdExpr: Expr.Cmds([
          Cmd.Dialogue({ character: 'Bob', line: 'ugh' }),
          Cmd.Dialogue({ character: 'Bob', line: 'terrible' }),
        ]),
      }),
    ]),
    Cmd.Def({
      variable: 'import-after',
      value: Expr.Lit('after.chat'),
    }),
    Cmd.Run(Expr.Var('import-after')),
  ],
}

test('transform AST', async (t) => {
  const visit = {
    Expr: {
      'Expr.Import': ({ path }) =>
        AsyncIO.fromPromise(async () => {
          return Expr.Lit(path)
        }),
    },
  }
  const transformer = transformM(AsyncIO.of)(visit)
  const transformed = await (transformer(program) as AsyncIO<Prog>).toPromise()
  t.deepEqual(transformed, expected)
})
