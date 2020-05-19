import match from '../util/match'
import { Loc } from '../static/location'
import { Prog } from '../static/ast'
import queryLocation from '../static/query-location'
import { Output, Runtime, RuntimeThread } from './runtime-sync'
import { runCmds } from './run-prog'
import { runInterpreter } from './run-interpreter'
import {
  empty,
  RuntimeContext,
  ParallelRuntimeContext,
} from './runtime-context'

const defaultState = empty

export const run = (program: Prog): Iterable<Output> =>
  resume(defaultState, program)

export const resume = (rt: RuntimeContext, program: Prog): Iterable<Output> =>
  resumeRuntime(rt, program).run(rt)

const runAtLocation = (loc: Loc, program: Prog): Runtime<any> => {
  const maybeCmds = queryLocation(loc)(program)
  const cmds = maybeCmds.maybe(
    (cmds) => cmds,
    () => []
  )
  return runInterpreter(runCmds(cmds))
}

const resumeRuntime = (rt: RuntimeContext, program: Prog): Runtime<any> =>
  match(rt, {
    'RuntimeContext.Seq': ({ loc }) => runAtLocation(loc, program),
    'RuntimeContext.ParFirst': ({ threads }) => {
      const processes = resumeThreads(threads, program)
      return Runtime.forkFirst(processes, rt as ParallelRuntimeContext)
    },
    'RuntimeContext.ParAll': ({ threads }) => {
      const processes = resumeThreads(threads, program)
      return Runtime.forkAll(processes, rt as ParallelRuntimeContext)
    },
  }).flatMap(() =>
    // TODO: should this yield something instead of undefined?
    rt.stack
      ? Runtime.popStack().flatMap(() => resumeRuntime(rt.stack, program))
      : Runtime.of(undefined)
  )

const resumeThreads = (
  threadContexts: RuntimeContext[],
  program: Prog
): RuntimeThread<any>[] =>
  threadContexts.map(
    (threadContext: RuntimeContext): RuntimeThread<any> => ({
      runtime: resumeRuntime(threadContext, program),
      loc: (threadContext as any).loc,
    })
  )
