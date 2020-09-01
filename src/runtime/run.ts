import { Stream } from 'xstream'
import match from '../util/match'
import { Loc } from '../static/location'
import { Prog } from '../static/ast'
import queryLocation from '../static/query-location'
import { Output, Runtime, RuntimeThread } from './runtime-async'
import { runCmds } from './run-prog'
import { runInterpreter } from './run-interpreter'
import {
  empty,
  RuntimeContext,
  ParallelRuntimeContext,
} from './runtime-context'

const defaultState = empty

export const run = (program: Prog): Stream<Output> => resume(program)

export const resume = (
  program: Prog,
  rt: RuntimeContext = defaultState
): Stream<Output> => resumeRuntime(rt, program).run(rt).output

const runAtLocation = (
  loc: Loc,
  program: Prog,
  after: boolean = false
): Runtime<any> => {
  const maybeCmds = queryLocation(loc)(program)
  const cmds = maybeCmds.maybe(
    (cmds) => cmds,
    () => []
  )
  const remaining = after ? cmds.slice(1) : cmds
  return runInterpreter(runCmds(remaining))
}

const resumeRuntime = (
  rt: RuntimeContext,
  program: Prog,
  after: boolean = false
): Runtime<any> =>
  match(rt, {
    'RuntimeContext.Seq': ({ loc }) => runAtLocation(loc, program, after),
    'RuntimeContext.ParFirst': ({ threads }) => {
      const processes = resumeThreads(threads, program)
      return Runtime.forkFirst(processes, rt as ParallelRuntimeContext)
    },
    'RuntimeContext.ParAll': ({ threads }) => {
      const processes = resumeThreads(threads, program)
      return Runtime.forkAll(processes, rt as ParallelRuntimeContext)
    },
  }).flatMap((value) =>
    rt.stack
      ? Runtime.popStack().flatMap(() => resumeRuntime(rt.stack, program, true))
      : Runtime.of(value)
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
