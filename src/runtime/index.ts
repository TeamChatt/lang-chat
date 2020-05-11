import { AsyncIO } from '../monad/async-io'
import { Prog } from '../ast'
import { runProg } from './run-prog'
import { runInterpreter } from './run-interpreter'

export const runGame = (program: Prog): AsyncIO<any> =>
  runInterpreter(runProg(program))
