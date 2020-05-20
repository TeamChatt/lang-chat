import { program } from './programs/fork-first'
import print from './static/print'
import tagLocation from './static/tag-location'
import { run, resume, RuntimeContext } from './runtime'
import { driver } from './driver'

const rtContext: RuntimeContext = {
  kind: 'RuntimeContext.ParFirst',
  threads: [
    {
      kind: 'RuntimeContext.Seq',
      bindings: {},
      stack: {
        kind: 'RuntimeContext.Seq',
        bindings: {},
        stack: null,
        loc: ['commands', '[1]', 'branches', '[0]'],
      },
      loc: ['commands', '[1]', 'branches', '[0]', 'cmdExpr', 'cmds', '[0]'],
    },
    {
      kind: 'RuntimeContext.Seq',
      bindings: {},
      stack: null,
      loc: ['commands', '[1]', 'branches', '[1]'],
    },
  ],
  stack: {
    kind: 'RuntimeContext.Seq',
    bindings: {},
    stack: null,
    loc: ['commands', '[1]'],
  },
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
