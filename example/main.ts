import { parse, prepare, print, run, resume, RuntimeContext } from '../src'

import { driver } from './driver'

const source = `\
choose
  choice "\\"Computer science joke\\"" do
    @Alice
      > There are only two hard problems in computer science
      0. Naming things
      1. Cache invalidation
      2. Off by one errors
  choice "\\"Distributed computing joke\\"" do
    @Alice
      > There are only two hard problems in distributed computing
      2. Exactly-once delivery
      1. Guaranteed order of messages
      2. Exactly-once delivery
`
const program = parse(source)
const taggedProgram = prepare(program)
console.log(print(taggedProgram))

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
