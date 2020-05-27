import { program } from './programs/dialogue-multi'
import print from './static/print'
import tagLocation from './static/tag-location'
import { run, resume, RuntimeContext } from './runtime'
import { driver } from './driver'

import { typeCheck } from './static/type-check'

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
// const io = resume(rtContext, taggedProgram)
const io = run(taggedProgram)

io.subscribe({
  next: ([ctx, effect]) => {
    console.log(ctx)
    effect(driver)
  },
  error: (err) => {
    driver.error(err)
  },
})
