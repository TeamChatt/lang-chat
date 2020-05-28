import test from 'ava'
import { Prog, Cmd, typeCheck } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'Alice', line: 'knock knock' }),
    Cmd.Dialogue({ character: 'Bob', line: "who's there?" }),
    Cmd.Dialogue({ character: 'Alice', line: 'spell' }),
    Cmd.Dialogue({ character: 'Bob', line: 'spell who?' }),
    Cmd.Dialogue({ character: 'Alice', line: 'okay. W - H - O' }),
  ],
}

test('check dialogue', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})
