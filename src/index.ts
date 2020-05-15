import { program } from './programs/fork-first'
import print from './static/print'
import tagLocation from './static/tag-location'
import { run, resume, RuntimeContext } from './runtime'

const rtContext: RuntimeContext = {
  kind: 'RuntimeContext.ParFirst',
  threads: [
    {
      kind: 'RuntimeContext.Seq',
      bindings: {},
      stack: null,
      loc: ['commands', '[1]', 'branches', '[1]'],
    },
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
  ],
  stack: {
    kind: 'RuntimeContext.Seq',
    bindings: {},
    stack: null,
    loc: ['commands', '[1]'],
  },
  loc: ['commands', '[1]'],
}
const taggedProgram = tagLocation(program)

console.log(print(taggedProgram))
const io = resume(rtContext, taggedProgram)
for (const [ctx, effect] of io) {
  console.log(ctx)
  effect()
}
