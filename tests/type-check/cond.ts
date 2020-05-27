import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd, Expr, Branch } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.Run(
      Expr.Cond([
        Branch.Cond({
          condition: Expr.Lit('true'),
          result: Expr.Cmds([
            Cmd.Exec({ fn: 'exec-true', args: [] }),
            Cmd.Exec({ fn: 'exec-true', args: [] }),
          ]),
        }),
        Branch.Cond({
          condition: Expr.Lit('false'),
          result: Expr.Cmd(Cmd.Exec({ fn: 'exec-false', args: [] })),
        }),
      ])
    ),
  ],
}

test('check cond', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})
