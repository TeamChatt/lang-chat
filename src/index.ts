import { program } from './programs/choose-all'
import print from './static/print'
import tagLocation from './static/tag-location'
import { run, resume, RuntimeContext } from './runtime'
import { driver } from './driver'

const rtContext: RuntimeContext = {
  kind: 'RuntimeContext.Seq',
  bindings: {},
  stack: {
    kind: 'RuntimeContext.Seq',
    bindings: {},
    stack: null,
    loc: ['commands', '[0]'],
    choices: [
      {
        index: 1,
        label: 'second',
      },
      {
        index: 0,
        label: 'first',
      },
    ],
  },
  loc: ['commands', '[0]', 'branches', '[1]', 'cmdExpr', 'cmds', '[1]'],
  choices: [],
}
const taggedProgram = tagLocation(program)

console.log(print(taggedProgram))

// const io = run(taggedProgram)
const io = resume(rtContext, taggedProgram)

io.subscribe({
  next: ([ctx, effect]) => {
    console.log(ctx)
    effect(driver)
  },
  error: (err) => {
    driver.error(err)
  },
})
