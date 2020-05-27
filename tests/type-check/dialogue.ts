import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd } from '../../src/static/ast'

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
