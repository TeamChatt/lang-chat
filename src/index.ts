import { program } from './programs/fork-first'
import print from './static/print'
import tagLocation from './static/tag-location'
import { runGame } from './runtime'

console.log(print(program))
console.log(tagLocation(program))

const io = runGame(program)
for (const [ctx, effect] of io) {
  console.log(ctx)
  effect()
}
