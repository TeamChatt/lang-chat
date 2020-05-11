import { Output } from './runtime-sync'
import { Prog } from '../ast'
import { runProg } from './run-prog'
import { runInterpreter } from './run-interpreter'
import { empty } from './runtime-context'

const defaultState = empty

export const runGame = (program: Prog): Iterable<Output> =>
  runInterpreter(runProg(program)).run(defaultState)
