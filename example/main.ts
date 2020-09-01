import { parse, tagLocation, print, run, resume, RuntimeContext } from '../src'

import { driver } from './driver'

const source = `\
let joke-1 = do
  @Alice
    > There are only two hard problems in computer science
    0. Naming things
    1. Cache invalidation
    2. Off by one errors

let joke-2 = do
  @Alice
    > There are only two hard problems in distributed computing
    2. Exactly-once delivery
    1. Guaranteed order of messages
    2. Exactly-once delivery

let jokes = do
  run joke-1
  run joke-2

run jokes
fork-all
  branch do
    exec("fork-1")
    exec("fork-1")
  branch do
    exec("fork-2")
    exec("fork-2")

@Alice
  > I was gonna tell you a UDP joke...
  > but you probably wouldn't get it
`
const program = parse(source)
const taggedProgram = tagLocation(program)
console.log(print(taggedProgram))

const rtContext: RuntimeContext = {
  kind: 'RuntimeContext.Seq',
  bindings: {},
  stack: {
    kind: 'RuntimeContext.Seq',
    bindings: {},
    stack: {
      kind: 'RuntimeContext.Seq',
      bindings: {
        'joke-1': {
          kind: 'Result.Cmds',
          cmds: [
            {
              kind: 'Cmd.Dialogue',
              character: 'Alice',
              line: {
                kind: 'Expr.Lit',
                value:
                  'There are only two hard problems in computer science\n0. Naming things\n1. Cache invalidation\n2. Off by one errors',
              },
              loc: ['commands', '[0]', 'value', 'cmds', '[0]'],
            },
          ],
        },
        'joke-2': {
          kind: 'Result.Cmds',
          cmds: [
            {
              kind: 'Cmd.Dialogue',
              character: 'Alice',
              line: {
                kind: 'Expr.Lit',
                value:
                  'There are only two hard problems in distributed computing\n2. Exactly-once delivery\n1. Guaranteed order of messages\n2. Exactly-once delivery',
              },
              loc: ['commands', '[1]', 'value', 'cmds', '[0]'],
            },
          ],
        },
        jokes: {
          kind: 'Result.Cmds',
          cmds: [
            {
              kind: 'Cmd.Run',
              expr: {
                kind: 'Expr.Var',
                variable: 'joke-1',
              },
              loc: ['commands', '[2]', 'value', 'cmds', '[0]'],
            },
            {
              kind: 'Cmd.Run',
              expr: {
                kind: 'Expr.Var',
                variable: 'joke-2',
              },
              loc: ['commands', '[2]', 'value', 'cmds', '[1]'],
            },
          ],
        },
      },
      stack: null,
      loc: ['commands', '[3]'],
      choices: [],
    },
    loc: ['commands', '[2]', 'value', 'cmds', '[1]'],
    choices: [],
  },
  loc: ['commands', '[1]', 'value', 'cmds', '[0]'],
  choices: [],
}
// const io = resume(taggedProgram, rtContext)
const io = run(taggedProgram)

io.subscribe({
  next: ([effect, ctx]) => {
    console.log(ctx)
    effect(driver)
  },
  error: (err) => {
    driver.error(err)
  },
})
