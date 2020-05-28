import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const source = `exec("exec")
exec("exec-with-arg", "arg")
exec("exec-with-args", "arg", 2, false)
`
const program: Prog = {
  commands: [
    Cmd.Exec({ fn: 'exec', args: [] }),
    Cmd.Exec({ fn: 'exec-with-arg', args: [Expr.Lit('arg')] }),
    Cmd.Exec({
      fn: 'exec-with-args',
      args: [Expr.Lit('arg'), Expr.Lit(2), Expr.Lit(false)],
    }),
  ],
}

test('parse exec', testParse, source, program)
