import { program } from './programs/fork-first'
import print from './static/print'
import tagLocation from './static/tag-location'
import queryLocation from './static/query-location'
import { runGame } from './runtime'

const loc = ['commands', '[0]']
const taggedProgram = tagLocation(program)

console.log(taggedProgram)
console.log(print(taggedProgram))
console.log(queryLocation(loc)(taggedProgram))

const io = runGame(taggedProgram)
for (const [ctx, effect] of io) {
  console.log(ctx)
  effect()
}
