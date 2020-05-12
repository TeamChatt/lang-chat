import { program } from './programs/fork-first'
import print from './static/print'
import { runGame } from './runtime'

console.log(print(program))

const io = runGame(program)
for (const [ctx, effect] of io) {
  console.log(ctx)
  effect()
}
