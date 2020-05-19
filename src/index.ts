import { program } from './programs/seq'
import print from './static/print'
import tagLocation from './static/tag-location'
import { run, resume, RuntimeContext } from './runtime'

const rtContext: RuntimeContext = {
  kind: 'RuntimeContext.Seq',
  bindings: {},
  stack: null,
  loc: ['commands', '[1]'],
}
const taggedProgram = tagLocation(program)

console.log(print(taggedProgram))

// const io = run(taggedProgram)
const io = resume(rtContext, taggedProgram)

io.subscribe({
  next: ([ctx, effect]) => {
    console.log(ctx)
    effect()
  },
})
