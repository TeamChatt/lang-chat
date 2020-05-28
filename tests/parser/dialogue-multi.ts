import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd } from '../../src'

const source = `@Alice
  > I told my sister she was drawing her eyebrows on too high
  > She looked surprised
`
const program: Prog = {
  commands: [
    Cmd.Dialogue({
      character: 'Alice',
      line: 'I told my sister she was drawing her eyebrows on too high',
    }),
    Cmd.Dialogue({ character: 'Alice', line: 'She looked surprised' }),
  ],
}

test('parse dialogue-multi', testParse, source, program)
