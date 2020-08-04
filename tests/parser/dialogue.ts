import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const source = `\
@Alice
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
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('knock knock') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit("who's there?") }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('spell') }),
    Cmd.Dialogue({ character: 'Bob', line: Expr.Lit('spell who?') }),
    Cmd.Dialogue({ character: 'Alice', line: Expr.Lit('okay. W - H - O') }),
  ],
}

test('parse dialogue', testParse, source, program)
