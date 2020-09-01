import { parse, tagLocation, print, resume, RuntimeContext } from '../src'

import { driver } from './driver'

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
  stack: null,
  loc: ['commands', '[3]'],
  choices: [],
}
const io = resume(taggedProgram, rtContext)

io.subscribe({
  next: ([effect, ctx]) => {
    console.log(ctx)
    effect(driver)
  },
  error: (err) => {
    driver.error(err)
  },
})
