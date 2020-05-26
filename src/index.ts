import { program } from './programs/dialogue-multi'
import print from './static/print'
import tagLocation from './static/tag-location'
import { run, resume, RuntimeContext } from './runtime'
import { driver } from './driver'

const rtContext: RuntimeContext = {
  kind: 'RuntimeContext.Seq',
  bindings: {},
  stack: null,
  loc: ['commands', '[0]'],
  choices: [],
}
const taggedProgram = tagLocation(program)

console.log(print(taggedProgram))

const io = run(taggedProgram)
// const io = resume(rtContext, taggedProgram)

io.subscribe({
  next: ([ctx, effect]) => {
    console.log(ctx)
    effect(driver)
  },
  error: (err) => {
    driver.error(err)
  },
})
