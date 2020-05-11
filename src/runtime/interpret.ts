import { Prog } from '../ast'
import { AsyncIO } from '../monad/async-io'
import runProgram from './run'
import { Action, Runtime } from './actions'
import { after } from 'fluture'

const wait = (seconds) => AsyncIO.fromFuture(after(1000 * seconds)(null))

//TODO: how to write types for this
const match = (obj, cases) => cases[obj.kind](obj)

let state = [{}]

const interpreter = (action: Action): AsyncIO<any> =>
  match(action, {
    'Action.DefineVar': ({ variable, value }) =>
      AsyncIO.fromPromise(async () => {
        state[0][variable] = value
      }),
    'Action.LookupVar': ({ variable }) =>
      AsyncIO.fromPromise(async () => {
        const val = state[0][variable]
        return val
      }),
    'Action.Exec': ({ fn, args }) =>
      wait(3).flatMap(() =>
        AsyncIO.fromPromise(async () => {
          console.log({ fn, args })
        })
      ),
    'Action.ForkFirst': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Runtime<any>) =>
        runInterpreter(branch)
      )
      return AsyncIO.race(threads)
    },
    'Action.ForkAll': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads = branches.map((branch: Runtime<any>) =>
        runInterpreter(branch)
      )
      return AsyncIO.interleave(threads)
    },
    'Action.PromptChoice': ({ branches }) =>
      AsyncIO.fromPromise(async () => {
        //TODO: some kinda IO
        //let user pick a branch somehow
        return branches[0]
      }),
    'Action.PushStack': () =>
      AsyncIO.fromPromise(async () => {
        const clone = Object.assign({}, state[0])
        state.unshift(clone)
      }),
    'Action.PopStack': () =>
      AsyncIO.fromPromise(async () => {
        state.shift()
      }),
  })

const runInterpreter = (x: Runtime<any>): AsyncIO<any> =>
  x.foldMap(interpreter, AsyncIO.of) as AsyncIO<any>

const interpret = (program: Prog): AsyncIO<any> =>
  runInterpreter(runProgram(program))

export default interpret
