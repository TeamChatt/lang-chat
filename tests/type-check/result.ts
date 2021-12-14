import test from 'ava'
import { Prog, Cmd, Expr, typeCheck } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'value-1',
      value: Expr.Result(
        Expr.Cmd(
          Cmd.Exec({
            fn: 'function',
            args: [],
          })
        )
      ),
    }),
    Cmd.Def({
      variable: 'value-2',
      value: Expr.Result(
        Expr.Cmd(
          Cmd.Exec({
            fn: 'function',
            args: [Expr.Lit('hello')],
          })
        )
      ),
    }),
    Cmd.Def({
      variable: 'value-3',
      value: Expr.Result(
        Expr.Cmd(
          Cmd.Exec({
            fn: 'function',
            args: [
              Expr.Binary({
                op: '+',
                exprLeft: Expr.Lit(1),
                exprRight: Expr.Lit(1),
              }),
            ],
          })
        )
      ),
    }),
  ],
}

test('check eval', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})

const programError: Prog = {
  commands: [
    Cmd.Def({
      variable: 'value-1',
      value: Expr.Result(
        Expr.Cmd(
          Cmd.Exec({
            fn: 'exec-with-args',
            args: [
              Expr.Cmd(Cmd.Def({ variable: 'x', value: Expr.Lit('3') })),
              Expr.Lit('arg2'),
            ],
          })
        )
      ),
    }),
  ],
}

test('check reject eval', (t) => {
  t.throws(() => typeCheck(programError), {
    message: "Can't call exec with command type",
  })
})
