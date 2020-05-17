import { program } from './programs/run-seq'
import print from './static/print'
import tagLocation from './static/tag-location'
import { run, resume, RuntimeContext } from './runtime'

const rtContext: RuntimeContext = {
  kind: 'RuntimeContext.Seq',
  bindings: {
    label: {
      kind: 'Result.Cmds',
      cmds: [
        {
          kind: 'Cmd.Exec',
          fn: 'exec',
          args: [],
          loc: ['commands', '[0]', 'cmds', '[0]'],
        },
      ],
    },
  },
  stack: {
    kind: 'RuntimeContext.Seq',
    bindings: {
      label: {
        kind: 'Result.Cmds',
        cmds: [
          {
            kind: 'Cmd.Exec',
            fn: 'exec',
            args: [],
            loc: ['commands', '[0]', 'cmds', '[0]'],
          },
        ],
      },
    },
    stack: null,
    loc: ['commands', '[2]'],
  },
  loc: ['commands', '[0]', 'cmds', '[0]'],
}
const taggedProgram = tagLocation(program)

console.log(print(taggedProgram))

// const io = run(taggedProgram)
const io = resume(rtContext, taggedProgram)

for (const [ctx, effect] of io) {
  console.log(ctx)
  effect()
}
