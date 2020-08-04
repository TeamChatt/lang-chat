import test from 'ava'
import { testParse } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const source = `\
@Alice
  > There are only two hard problems in computer science
  0. Naming things
  1. Cache invalidation
  2. Off by one errors
  
  > There are only two hard problems in distributed computing
  2. Exactly-once delivery
  1. Guaranteed order of messages
  2. Exactly-once delivery
`
const program: Prog = {
  commands: [
    Cmd.Dialogue({
      character: 'Alice',
      line: Expr.Lit(`\
There are only two hard problems in computer science
0. Naming things
1. Cache invalidation
2. Off by one errors
`),
    }),
    Cmd.Dialogue({
      character: 'Alice',
      line: Expr.Lit(`\
There are only two hard problems in distributed computing
2. Exactly-once delivery
1. Guaranteed order of messages
2. Exactly-once delivery`),
    }),
  ],
}

test.only('parse dialogue-formatted', testParse, source, program)
