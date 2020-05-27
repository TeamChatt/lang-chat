import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.Exec({ fn: 'exec', args: [] }),
    Cmd.Exec({ fn: 'exec-with-arg', args: [Expr.Lit('arg')] }),
    Cmd.Exec({
      fn: 'exec-with-args',
      args: [Expr.Lit('arg1'), Expr.Lit('arg2')],
    }),
  ],
}

test('check exec', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})
