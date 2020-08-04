import {
  parse,
  tagLocation,
  typeCheck,
  print,
  run,
  resume,
  RuntimeContext,
} from '../src'

import { program } from './programs/dialogue-multi'
import { driver } from './driver'

const taggedProgram = tagLocation(program)

console.log(print(taggedProgram))
console.log(typeCheck(taggedProgram))
console.log(print(taggedProgram))

// const rtContext: RuntimeContext = {}
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
