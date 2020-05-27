import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Cmds([
        Cmd.Exec({ fn: 'exec1', args: [] }),
        Cmd.Exec({ fn: 'exec2', args: [] }),
      ]),
    }),
    Cmd.Run(Expr.Var('start')),
  ],
}

test('check decl-run', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})
