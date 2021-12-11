import test from 'ava'
import { Prog, Cmd, Expr, Branch, typeCheck } from '../../src'

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

test('check reject cond 1', (t) => {
  t.throws(() => typeCheck(programError1), {
    message: `Couldn't unify types: ["Cmd<Any>","String"]`,
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
    message: 'Expected type Bool, but found Number',
  })
})
