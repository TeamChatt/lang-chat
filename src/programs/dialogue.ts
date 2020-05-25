import { Prog, Cmd } from '../static/ast'

export const program: Prog = {
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

export const expectedOutput = [
  'knock knock',
  "who's there?",
  'lettuce',
  'lettuce who?',
  "lettuce in, it's cold out here",
]
