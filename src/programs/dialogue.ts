import { Prog, Cmd } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'A', line: 'knock knock' }),
    Cmd.Dialogue({ character: 'B', line: "who's there?" }),
    Cmd.Dialogue({ character: 'A', line: 'lettuce' }),
    Cmd.Dialogue({ character: 'B', line: 'lettuce who?' }),
    Cmd.Dialogue({ character: 'A', line: "lettuce in, it's cold out here" }),
  ],
}

export const expectedOutput = [
  'knock knock',
  "who's there?",
  'lettuce',
  'lettuce who?',
  "lettuce in, it's cold out here",
]
