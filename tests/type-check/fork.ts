import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd, Expr, Branch } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.ForkAll([
      Branch.Fork(
        Expr.Cmds([
          Cmd.Exec({ fn: 'exec-branch-1', args: [] }),
          Cmd.Exec({ fn: 'exec-branch-1', args: [] }),
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
}

test('check fork', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})

const programError: Prog = {
  commands: [
    Cmd.ForkAll([
      Branch.Fork(
        Expr.Cond([
          Branch.Cond({ condition: Expr.Lit('true'), result: Expr.Lit('3') }),
          Branch.Cond({ condition: Expr.Lit('false'), result: Expr.Lit('5') }),
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
}

test('check reject fork', (t) => {
  t.throws(() => typeCheck(programError), { message: "Types don't match" })
})
