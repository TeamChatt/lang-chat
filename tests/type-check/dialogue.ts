import test from 'ava'
import { Prog, Cmd, typeCheck, Expr } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('knock knock') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit("who's there?") }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('spell') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('spell who?') }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('okay. W - H - O') }),
  ],
}

test('check dialogue', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})
