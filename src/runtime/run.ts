import match from '../util/match'
import { Loc } from '../static/location'
import { Prog } from '../static/ast'
import queryLocation from '../static/query-location'
import { Output, RuntimeSync, RuntimeSyncThread } from './runtime-sync'
import { runCmds } from './run-prog'
import { runInterpreter } from './run-interpreter'
import { empty, RuntimeContext } from './runtime-context'

const defaultState = empty

export const run = (program: Prog): Iterable<Output> =>
  resume(defaultState, program)

export const resume = (rt: RuntimeContext, program: Prog): Iterable<Output> =>
  resumeRuntime(rt, program).run(defaultState)

const runAtLocation = (loc: Loc, program: Prog): RuntimeSync<any> => {
  const maybeCmds = queryLocation(loc)(program)
  const cmds = maybeCmds.maybe(
    (cmds) => cmds,
    () => []
  )
  return runInterpreter(runCmds(cmds))
}

const resumeRuntime = (rt: RuntimeContext, program: Prog): RuntimeSync<any> =>
  match(rt, {
    'RuntimeContext.Seq': ({ loc }) => runAtLocation(loc, program),
    'RuntimeContext.ParFirst': ({ threads, loc }) => {
      const processes = resumeThreads(threads, program)
      return RuntimeSync.forkFirst(processes, loc)
    },
    'RuntimeContext.ParAll': ({ threads, loc }) => {
      const processes = resumeThreads(threads, program)
      return RuntimeSync.forkAll(processes, loc)
    },
  }).flatMap(() =>
    // TODO: should this yield something instead of undefined?
    rt.stack ? resumeRuntime(rt.stack, program) : RuntimeSync.of(undefined)
  )

const resumeThreads = (
  threadContexts: RuntimeContext[],
  program: Prog
): RuntimeSyncThread<any>[] =>
  threadContexts.map(
    (threadContext: RuntimeContext): RuntimeSyncThread<any> => ({
      runtime: resumeRuntime(threadContext, program),
      loc: threadContext.loc,
    })
  )
