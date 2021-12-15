import test from 'ava'
import { testProgram, testRuntime } from '../helpers'
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
  { character: 'Alice', line: 'knock knock' },
  { character: 'Bob', line: "who's there?" },
  { character: 'Alice', line: 'lettuce' },
  { character: 'Bob', line: 'lettuce who?' },
  { character: 'Alice', line: "lettuce in, it's cold out here" },
]

test('run dialogue', testProgram, program, expectedOutput)

test('resume dialogue', testRuntime, program, expectedOutput)
