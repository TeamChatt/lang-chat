import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('knock knock') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit("who's there?") }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('lettuce') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('lettuce who?') }),
    Cmd.Dialogue({
      character: 'Alice',
      line: Expr.Lit("lettuce in, it's cold out here"),
    }),
  ],
}

const expectedOutput = [
  'knock knock',
  "who's there?",
  'lettuce',
  'lettuce who?',
  "lettuce in, it's cold out here",
]

test('run dialogue', testProgram, program, expectedOutput)
