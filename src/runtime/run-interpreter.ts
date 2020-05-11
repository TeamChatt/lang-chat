import { RuntimeSync } from './runtime-sync'
import { Action, Interpreter } from './interpreter'

//TODO: how to write types for this
const match = (obj, cases) => cases[obj.kind](obj)

const runAction = (action: Action): RuntimeSync<any> =>
  match(action, {
    // Variable Binding
    'Action.DefineVar': ({ variable, value }) =>
      RuntimeSync.defineVar(variable, value),
    'Action.LookupVar': ({ variable }) => RuntimeSync.lookupVar(variable),
    'Action.PushStack': () => RuntimeSync.pushStack(),
    'Action.PopStack': () => RuntimeSync.popStack(),
    // Control Flow
    'Action.ForkFirst': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads: RuntimeSync<any>[] = branches.map(runInterpreter)
      return RuntimeSync.forkFirst(threads)
    },
    'Action.ForkAll': ({ branches }) => {
      //TODO: need to make sure each branch gets isolated state
      const threads: RuntimeSync<any>[] = branches.map(runInterpreter)
      return RuntimeSync.forkAll(threads)
    },
    // Game Effects
    'Action.Exec': ({ fn, args }) =>
      RuntimeSync.fromEffect(() => {
        console.log({ fn, args })
      }),
    'Action.PromptChoice': ({ branches }) =>
      RuntimeSync.fromEffect(() => {
        //TODO: some kinda IO
        //let user pick a branch somehow
        return branches[0]
      }),
  })

export const runInterpreter = (
  interpreter: Interpreter<any>
): RuntimeSync<any> =>
  interpreter.foldMap(runAction, RuntimeSync.of) as RuntimeSync<any>
