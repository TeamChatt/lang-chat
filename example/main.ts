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

// const rtContext: RuntimeContext = {
//   kind: 'RuntimeContext.Seq',
//   bindings: {},
//   stack: null,
//   loc: ['commands', '[0]'],
//   choices: [],
// }
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
