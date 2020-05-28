import test from 'ava'
import { Prog, Cmd, Expr, typeCheck } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'x',
      value: Expr.Binary({
        exprLeft: Expr.Lit(3),
        op: '+',
        exprRight: Expr.Lit(4),
      }),
    }),
    Cmd.Def({
      variable: 'y',
      value: Expr.Binary({
        exprLeft: Expr.Var('x'),
        op: '==',
        exprRight: Expr.Lit(10),
      }),
    }),
  ],
}

test('check ops', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})

const programError: Prog = {
  commands: [
    Cmd.Def({
      variable: 'x',
      value: Expr.Binary({
        exprLeft: Expr.Lit(3),
        op: '+',
        exprRight: Expr.Lit(4),
      }),
    }),
    Cmd.Def({
      variable: 'y',
      value: Expr.Binary({
        exprLeft: Expr.Var('x'),
        op: '==',
        exprRight: Expr.Lit(false),
      }),
    }),
  ],
}

test('check reject ops', (t) => {
  t.throws(() => typeCheck(programError), {
    message: `Couldn't unify types: ["Type.Number","Type.Bool"]`,
  })
})
