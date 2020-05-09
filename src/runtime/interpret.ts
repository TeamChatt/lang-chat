import { Prog } from '../ast'
import { IO } from '../monad/io'
import runProgram from './run'
import { Action, Runtime } from './actions'

//TODO: how to write types for this
const match = (obj, cases) => cases[obj.kind](obj)

let state = [{}]

const interpreter = (action: Action): IO<any> =>
  match(action, {
    'Action.DefineVar': ({ variable, value }) =>
      IO.impure(() => {
        state[0][variable] = value
      }),
    'Action.LookupVar': ({ variable }) =>
      IO.impure(() => {
        const val = state[0][variable]
        return val
      }),
    'Action.Exec': ({ fn, args }) =>
      IO.impure(() => {
        console.log({ fn, args })
      }),
    'Action.ForkFirst': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Runtime<any>) =>
        runInterpreter(branch)
      )
      //TODO: run threads with interleaving
      return IO.of(null)
    },
    'Action.ForkLast': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Runtime<any>) =>
        runInterpreter(branch)
      )
      //TODO: run threads with interleaving
      return IO.of(null)
    },
    'Action.PromptChoice': ({ branches }) => {
      //TODO: some kinda IO
      return IO.of(null)
    },
    'Action.PushStack': () =>
      IO.impure(() => {
        const clone = Object.assign({}, state[0])
        state.unshift(clone)
      }),
    'Action.PopStack': () =>
      IO.impure(() => {
        state.shift()
      }),
  })

const runInterpreter = (x: Runtime<any>): IO<any> =>
  x.foldMap(interpreter, IO.of) as IO<any>

const interpret = (program: Prog): IO<any> =>
  runInterpreter(runProgram(program))

export default interpret
