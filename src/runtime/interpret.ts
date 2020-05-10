import { Prog } from '../ast'
import { AsyncIO } from '../monad/async-io'
import runProgram from './run'
import { Action, Runtime } from './actions'

const wait = (seconds) =>
  new Promise((resolve) => window.setTimeout(resolve, seconds * 1000))

//TODO: how to write types for this
const match = (obj, cases) => cases[obj.kind](obj)

let state = [{}]

const interpreter = (action: Action): AsyncIO<any> =>
  match(action, {
    'Action.DefineVar': ({ variable, value }) =>
      AsyncIO.impure(async () => {
        state[0][variable] = value
      }),
    'Action.LookupVar': ({ variable }) =>
      AsyncIO.impure(async () => {
        const val = state[0][variable]
        return val
      }),
    'Action.Exec': ({ fn, args }) =>
      AsyncIO.impure(async () => {
        await wait(3)
        console.log({ fn, args })
      }),
    'Action.ForkFirst': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Runtime<any>) =>
        runInterpreter(branch)
      )
      //TODO: make sure we can interrupt threads
      return AsyncIO.interleave(threads)
    },
    'Action.ForkLast': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Runtime<any>) =>
        runInterpreter(branch)
      )
      return AsyncIO.race(threads)
    },
    'Action.PromptChoice': ({ branches }) =>
      AsyncIO.impure(async () => {
        //TODO: some kinda IO
        //let user pick a branch somehow
        return branches[0]
      }),
    'Action.PushStack': () =>
      AsyncIO.impure(async () => {
        const clone = Object.assign({}, state[0])
        state.unshift(clone)
      }),
    'Action.PopStack': () =>
      AsyncIO.impure(async () => {
        state.shift()
      }),
  })

const runInterpreter = (x: Runtime<any>): AsyncIO<any> =>
  x.foldMap(interpreter, AsyncIO.of) as AsyncIO<any>

const interpret = (program: Prog): AsyncIO<any> =>
  runInterpreter(runProgram(program))

export default interpret
