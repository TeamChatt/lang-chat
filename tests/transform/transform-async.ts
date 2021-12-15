import test from 'ava'
import { Prog, Cmd, Expr, Branch, transformM, tagLocation } from '../../src'
import { AsyncIO } from '../../src/monad/async-io'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'import-before',
      value: Expr.Import('before.chat'),
    }),
    Cmd.Run(Expr.Var('import-before')),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('knock knock') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit("who's there?") }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('lettuce') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('lettuce who?') }),
    Cmd.Dialogue({
      character: 'Alice',
      line: Expr.Lit("lettuce in, it's cold out here"),
    }),
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'laugh',
        cmdExpr: Expr.Cmds([
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('haha') }),
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('good one') }),
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
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('ugh') }),
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('terrible') }),
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
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('knock knock') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit("who's there?") }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('lettuce') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('lettuce who?') }),
    Cmd.Dialogue({
      character: 'Alice',
      line: Expr.Lit("lettuce in, it's cold out here"),
    }),
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'laugh',
        cmdExpr: Expr.Cmds([
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('haha') }),
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('good one') }),
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
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('ugh') }),
          Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('terrible') }),
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

test('transform AST preserves label', async (t) => {
  const visit = {
    Expr: {
      'Expr.Import': ({ path }) =>
        AsyncIO.fromPromise(async () => {
          return Expr.Lit(path)
        }),
    },
  }
  const transformer = transformM(AsyncIO.of)(visit)
  const transformed = await (
    transformer(tagLocation(program)) as AsyncIO<Prog>
  ).toPromise()
  t.deepEqual(transformed, tagLocation(expected))
})
