import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

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

const expectedOutput = [{ character: 'Alice', line: 'Nice to meet you, Bob!' }]

test('run dialogue with interpolation', testProgram, program, expectedOutput)
