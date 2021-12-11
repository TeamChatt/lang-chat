import test from 'ava'
import { TypeError } from '../../src/static/type-checker'
import { Prog, Cmd, Expr, Branch, tagLocation, typeCheck } from '../../src'

const programError: Prog = tagLocation({
  commands: [
    Cmd.Exec({ fn: 'exec-top', args: [] }),
    Cmd.Exec({ fn: 'exec-top', args: [] }),
    Cmd.ForkAll([
      Branch.Fork(
        Expr.Cond([
          Branch.Cond({ condition: Expr.Lit(true), result: Expr.Lit('3') }),
          Branch.Cond({ condition: Expr.Lit(false), result: Expr.Lit('5') }),
        ])
      ),
      Branch.Fork(
        Expr.Cmds([
          Cmd.Exec({ fn: 'exec-branch-2', args: [] }),
          Cmd.Exec({ fn: 'exec-branch-2', args: [] }),
        ])
      ),
    ]),
  ],
})

test('check reject fork', (t) => {
  const error = t.throws(() => typeCheck(programError), {
    message: 'Expected type Cmd<Any>, but found String',
  })
  t.deepEqual((error as TypeError).loc, ['commands', '[2]'])
})
