import { program } from './programs/decl-run-local'
import print from './print'
import { runGame } from './runtime/'

console.log(print(program))

const io = runGame(program)
io.run()
