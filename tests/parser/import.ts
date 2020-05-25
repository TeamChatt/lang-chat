import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const source = `let x = import("path-x")
let y = import("path-y")
let z = import("path-z")
`
const program: Prog = {
  commands: [
    Cmd.Def({ variable: 'x', value: Expr.Import('path-x') }),
    Cmd.Def({ variable: 'y', value: Expr.Import('path-y') }),
    Cmd.Def({ variable: 'z', value: Expr.Import('path-z') }),
  ],
}

test('parse import', testParse, source, program)
