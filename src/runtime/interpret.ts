import { Prog } from '../ast'
import { Id } from '../monad/id'
import runProgram from './run'
import { Action, Interpreter } from './actions'

//TODO: how to write types for this
const match = (obj, cases) => cases[obj.kind](obj)

let state = [{}]
const interpreter = (action: Action): Id<any> =>
  match(action, {
    'Action.DefineVar': ({ variable, value }) => {
      state[0][variable] = value
      return Id.of(null)
    },
    'Action.LookupVar': ({ variable }) => {
      const val = state[variable]
      return Id.of(val)
    },
    'Action.Exec': ({ fn, args }) => {
      console.log({ fn, args })
      return Id.of(null)
    },
    'Action.ForkFirst': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Interpreter<any>) =>
        runInterpreter(branch)
      )
      //TODO: run threads with interleaving
      return Id.of(null)
    },
    'Action.ForkLast': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Interpreter<any>) =>
        runInterpreter(branch)
      )
      //TODO: run threads with interleaving
      return Id.of(null)
    },
    'Action.PromptChoice': ({ branches }) => {
      //TODO: some kinda IO
      return Id.of(null)
    },
    'Action.PushStack': () => {
      const clone = Object.assign({}, state[0])
      state.unshift(clone)
      return Id.of(null)
    },
    'Action.PopStack': () => {
      state.shift()
      return Id.of(null)
    },
  })

const runInterpreter = (x: Interpreter<any>) => x.foldMap(interpreter, Id.of)
const interpret = (program: Prog) => runInterpreter(runProgram(program))

export default interpret
