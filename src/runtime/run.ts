import { Stream } from 'xstream'
import { match } from '../util/match'
import { Loc } from '../static/location'
import { Prog, Cmd } from '../static/ast'
import { queryLocation } from '../static/query-location'
import { Output, Runtime, RuntimeThread } from './runtime-async'
import { runCmds } from './run-prog'
import { runInterpreter } from './run-interpreter'
import {
  empty,
  RuntimeContext,
  ParallelRuntimeContext,
  SequentialRuntimeContext,
} from './runtime-context'

const defaultState = empty

export const run = (program: Prog): Stream<Output> => resume(program)

export const resume = (
  program: Prog,
  rt: RuntimeContext = defaultState
): Stream<Output> => resumeRuntime(rt, program).run(rt).output

const cmdsAtLocation = (loc: Loc, program: Prog): Cmd[] =>
  queryLocation(loc)(program).maybe(
    (cmds) => cmds,
    () => []
  )

const resumeRuntime = (rt: RuntimeContext, program: Prog): Runtime<any> =>
  startStack(rt, program).flatMap(() => continueStack(rt, program))

const startStack = (rt: RuntimeContext, program: Prog): Runtime<any> =>
  match(rt, {
    'RuntimeContext.Seq': ({ loc }) =>
      runInterpreter(runCmds(cmdsAtLocation(loc, program))),
    'RuntimeContext.ParFirst': ({ threads }) => {
      const processes = resumeThreads(threads, program)
      return Runtime.forkFirst(processes, rt as ParallelRuntimeContext)
    },
    'RuntimeContext.ParAll': ({ threads }) => {
      const processes = resumeThreads(threads, program)
      return Runtime.forkAll(processes, rt as ParallelRuntimeContext)
    },
  })

const continueStack = (rt: RuntimeContext, program: Prog): Runtime<any> =>
  rt.stack
    ? Runtime.popStack()
        .flatMap(() => {
          const stack = rt.stack as SequentialRuntimeContext
          const cmds = cmdsAtLocation(stack.loc, program).slice(1)
          return runInterpreter(runCmds(cmds))
        })
        .flatMap(() => continueStack(rt.stack!, program))
    : Runtime.of(null)

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
