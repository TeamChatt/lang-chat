import { Effect } from './runtime-sync'
import { Prog } from '../ast'
import { runProg } from './run-prog'
import { runInterpreter } from './run-interpreter'

const defaultState = {}

export const runGame = (program: Prog): Iterable<Effect> =>
  runInterpreter(runProg(program)).runThread(defaultState)
