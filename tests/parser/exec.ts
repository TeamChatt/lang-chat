import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const source = `exec("exec")
exec("exec-with-arg", "arg")
exec("exec-with-args", "arg1", "arg2")
`
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

test('exec', testParse, source, program)
