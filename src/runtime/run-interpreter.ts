import match from '../util/match'
import { Runtime, RuntimeThread } from './runtime-async'
import { Action, Interpreter, InterpreterThread } from './interpreter'

const runAction = (action: Action): Runtime<any> =>
  match(action, {
    // Variable Binding
    'Action.DefineVar': ({ variable, value }) =>
      Runtime.defineVar(variable, value),
    'Action.LookupVar': ({ variable }) => Runtime.lookupVar(variable),
    'Action.PushStack': () => Runtime.pushStack(),
    'Action.PopStack': () => Runtime.popStack(),
    // Control Flow
    'Action.Step': ({ loc }) => Runtime.step(loc),
    'Action.ForkFirst': ({ branches }) => {
      const threads: RuntimeThread<any>[] = branches.map(runInterpreterThread)
      return Runtime.forkFirst(threads)
    },
    'Action.ForkAll': ({ branches }) => {
      const threads: RuntimeThread<any>[] = branches.map(runInterpreterThread)
      return Runtime.forkAll(threads)
    },
    // Game Effects
    'Action.Exec': ({ fn, args }) =>
      Runtime.fromEffect(async () => {
        console.log({ fn, args })
        await new Promise((resolve) => {
          window.setTimeout(resolve, 1000)
        })
      }),
    'Action.PromptChoice': ({ branches }) =>
      Runtime.fromEffect(async () => {
        //TODO: some kinda IO
        //let user pick a branch somehow
        return branches[0]
      }),
  })

const runInterpreterThread = (
  thread: InterpreterThread<any>
): RuntimeThread<any> => ({
  runtime: runInterpreter(thread.interpreter),
  loc: thread.loc,
})

export const runInterpreter = (interpreter: Interpreter<any>): Runtime<any> =>
  interpreter.foldMap(runAction, Runtime.of) as Runtime<any>
