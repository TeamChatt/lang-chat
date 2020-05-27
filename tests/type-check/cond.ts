import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd, Expr, Branch } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'var',
      value: Expr.Cond([
        Branch.Cond({
          condition: Expr.Lit(true),
          result: Expr.Cmds([
            Cmd.Exec({ fn: 'exec-true', args: [] }),
            Cmd.Exec({ fn: 'exec-true', args: [] }),
          ]),
        }),
        Branch.Cond({
          condition: Expr.Lit(false),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-false', args: [] })),
        }),
      ]),
    }),
  ],
}

test('check cond', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})

const programError1: Prog = {
  commands: [
    Cmd.Def({
      variable: 'var',
      // Cond branches don't unify
      value: Expr.Cond([
        Branch.Cond({
          condition: Expr.Lit(true),
          result: Expr.Cmds([
            Cmd.Exec({ fn: 'exec-true', args: [] }),
            Cmd.Exec({ fn: 'exec-true', args: [] }),
          ]),
        }),
        Branch.Cond({
          condition: Expr.Lit(false),
          result: Expr.Lit('3'),
        }),
      ]),
    }),
  ],
}

const typeError1 = `Couldn't unify types: [
  "Type.Cmd",
  "Type.String"
]`
test('check reject cond 1', (t) => {
  t.throws(() => typeCheck(programError1), {
    message: typeError1,
  })
})

const programError2: Prog = {
  commands: [
    Cmd.Def({
      variable: 'var',
      value: Expr.Cond([
        Branch.Cond({
          condition: Expr.Lit(3),
          result: Expr.Cmds([
            Cmd.Exec({ fn: 'exec-true', args: [] }),
            Cmd.Exec({ fn: 'exec-true', args: [] }),
          ]),
        }),
        Branch.Cond({
          condition: Expr.Lit(0),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-false', args: [] })),
        }),
      ]),
    }),
  ],
}

test('check reject cond 2', (t) => {
  t.throws(() => typeCheck(programError2), {
    message: 'Expected type Type.Bool, but found Type.Number',
  })
})
