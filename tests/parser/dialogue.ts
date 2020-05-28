import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd } from '../../src'

const source = `@Alice
  > knock knock
@Bob
  > who's there?
@Alice
  > spell
@Bob
  > spell who?
@Alice
  > okay. W - H - O
`
const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'Alice', line: 'knock knock' }),
    Cmd.Dialogue({ character: 'Bob', line: "who's there?" }),
    Cmd.Dialogue({ character: 'Alice', line: 'spell' }),
    Cmd.Dialogue({ character: 'Bob', line: 'spell who?' }),
    Cmd.Dialogue({ character: 'Alice', line: 'okay. W - H - O' }),
  ],
}

test('parse dialogue', testParse, source, program)
