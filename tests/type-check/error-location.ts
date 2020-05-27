import test from 'ava'
import tagLocation from '../../src/static/tag-location'
import { typeCheck } from '../../src/static/type-check'
import { TypeError } from '../../src/static/type-checker'
import { Prog, Cmd, Expr, Branch } from '../../src/static/ast'

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
    message: 'Expected type Type.Cmd, but found Type.String',
  })
  t.deepEqual((error as TypeError).loc, ['commands', '[2]'])
})
