import { match } from '../util/match'
import { Runtime, RuntimeThread } from './runtime-async'
import { Action, Interpreter, InterpreterThread } from './interpreter'
import { Driver } from './driver'

const diff =
  <T>(equals: (t1: T, t2: T) => Boolean) =>
  (arr1: T[], arr2: T[]): T[] =>
    arr1.filter((x) => !arr2.find((y) => equals(x, y)))

const runAction = (action: Action): Runtime<any> =>
  match(action, {
    // Variable Binding
    'Action.DefineVar': ({ variable, value }) =>
      Runtime.defineVar(variable, value),
    'Action.LookupVar': ({ variable }) =>
      Runtime.lookupVar(variable).flatMap((maybeValue) =>
        maybeValue.maybe(
          (val) => Runtime.of(val),
          () => Runtime.fail(`Unknown variable "${variable}"`)
        )
      ),
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
      Runtime.fromEffect(async (driver: Driver) => {
        return driver.exec(fn, args)
      }),
    'Action.Dialogue': ({ character, line }) =>
      Runtime.fromEffect(async (driver: Driver) => {
        return driver.dialogue(character, line)
      }),
    'Action.FilterChoices': ({ branches }) =>
      Runtime.visitedBranches().map((visited) =>
        diff((x: any, y: any) => x.index === y.index)(branches, visited)
      ),
    'Action.Choice': ({ branches }) =>
      Runtime.fromEffect(async (driver: Driver) => {
        return driver.branch(branches)
      }).flatMap((branch) => Runtime.visitBranch(branch).map(() => branch)),
  })

const runInterpreterThread = (
  thread: InterpreterThread<any>
): RuntimeThread<any> => ({
  runtime: runInterpreter(thread.interpreter),
  loc: thread.loc,
})

export const runInterpreter = (interpreter: Interpreter<any>): Runtime<any> =>
  interpreter.foldMap(runAction, Runtime.of) as Runtime<any>
