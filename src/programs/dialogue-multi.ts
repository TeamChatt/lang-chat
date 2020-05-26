import { Prog, Cmd } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'Alice', line: 'Haikus are fun' }),
    Cmd.Dialogue({
      character: 'Alice',
      line: "But sometimes they don't make sense",
    }),
    Cmd.Dialogue({ character: 'Alice', line: 'Refrigerator' }),
    Cmd.Dialogue({ character: 'Bob', line: 'How much can I fit' }),
    Cmd.Dialogue({ character: 'Bob', line: 'into a haiku format' }),
    Cmd.Dialogue({ character: 'Bob', line: "oh no I'm out of" }),
  ],
}

export const expectedOutput = [
  'Haikus are fun',
  "But sometimes they don't make sense",
  'Refrigerator',
  'How much can I fit',
  'into a haiku format',
  "oh no I'm out of",
]
