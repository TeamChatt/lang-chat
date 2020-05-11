import { program } from './programs/fork-first'
import print from './print'
import { runGame } from './runtime'

console.log(print(program))

const io = runGame(program)
for (const [ctx, effect] of io) {
  console.log(ctx)
  effect()
}
