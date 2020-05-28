import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'Alice', line: 'knock knock' }),
    Cmd.Dialogue({ character: 'Bob', line: "who's there?" }),
    Cmd.Dialogue({ character: 'Alice', line: 'lettuce' }),
    Cmd.Dialogue({ character: 'Bob', line: 'lettuce who?' }),
    Cmd.Dialogue({
      character: 'Alice',
      line: "lettuce in, it's cold out here",
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
