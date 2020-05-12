import { RuntimeSync, RuntimeSyncThread } from './runtime-sync'
import { Action, Interpreter, InterpreterThread } from './interpreter'

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
      const threads: RuntimeSyncThread<any>[] = branches.map(
        runInterpreterThread
      )
      return RuntimeSync.forkFirst(threads)
    },
    'Action.ForkAll': ({ branches }) => {
      const threads: RuntimeSyncThread<any>[] = branches.map(
        runInterpreterThread
      )
      return RuntimeSync.forkAll(threads)
    },
    // Game Effects
    'Action.Exec': ({ fn, args, loc }) =>
      RuntimeSync.fromEffect(() => {
        console.log({ fn, args })
      }, loc),
    'Action.PromptChoice': ({ branches, loc }) =>
      RuntimeSync.fromEffect(() => {
        //TODO: some kinda IO
        //let user pick a branch somehow
        return branches[0]
      }, loc),
  })

const runInterpreterThread = (
  thread: InterpreterThread<any>
): RuntimeSyncThread<any> => ({
  runtime: runInterpreter(thread.interpreter),
  loc: thread.loc,
})

export const runInterpreter = (
  interpreter: Interpreter<any>
): RuntimeSync<any> =>
  interpreter.foldMap(runAction, RuntimeSync.of) as RuntimeSync<any>
