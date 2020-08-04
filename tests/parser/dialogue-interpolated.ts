import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const source = `\
let name = "Bob"
@Alice
  > Nice to meet you, \${name}!
`
const program: Prog = {
  commands: [
    Cmd.Def({ variable: 'name', value: Expr.Lit('Bob') }),
    Cmd.Dialogue({
      character: 'Alice',
      line: Expr.Template([
        Expr.Lit('Nice to meet you, '),
        Expr.Var('name'),
        Expr.Lit('!'),
      ]),
    }),
  ],
}

test('parse dialogue with interpolation', testParse, source, program)
