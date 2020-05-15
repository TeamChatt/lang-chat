import match from '../util/match'
import { Loc } from '../static/ast'
import {
  BindingContext,
  empty as bindingEmpty,
  defineVar as bindingDefineVar,
  lookupVar as bindingLookupVar,
} from './binding-context'
import { Result } from './interpreter'

export type RuntimeContext = CtxSeq | CtxParFirst | CtxParAll
export type ParallelRuntimeContext = CtxParFirst | CtxParAll

interface CtxSeq {
  kind: 'RuntimeContext.Seq'
  bindings: BindingContext
  stack?: RuntimeContext
  loc: Loc
}
interface CtxParFirst {
  kind: 'RuntimeContext.ParFirst'
  threads: RuntimeContext[]
  stack?: RuntimeContext
}
interface CtxParAll {
  kind: 'RuntimeContext.ParAll'
  threads: RuntimeContext[]
  stack?: RuntimeContext
}

const ctxSeq = ({ bindings, stack, loc }): RuntimeContext => ({
  kind: 'RuntimeContext.Seq',
  bindings,
  stack,
  loc,
})

const ctxParFirst = ({ threads, stack }): ParallelRuntimeContext => ({
  kind: 'RuntimeContext.ParFirst',
  threads,
  stack,
})

const ctxParAll = ({ threads, stack }): ParallelRuntimeContext => ({
  kind: 'RuntimeContext.ParAll',
  threads,
  stack,
})

export const empty: RuntimeContext = ctxSeq({
  bindings: bindingEmpty,
  stack: null,
  loc: null, // TODO: "top" location?
})

export const defineVar = (variable: string, value: Result) => (
  rt: RuntimeContext
): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings, stack, loc }) =>
      ctxSeq({
        bindings: bindingDefineVar(variable, value)(bindings),
        stack,
        loc,
      }),
  })

export const lookupVar = (variable: string) => (rt: RuntimeContext): Result =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings }) =>
      bindingLookupVar(variable)(bindings), // TODO: return a maybe?
  })

export const popStack = (rt: RuntimeContext): RuntimeContext => rt.stack

export const pushStack = (rt: RuntimeContext): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings, loc }) =>
      ctxSeq({
        bindings,
        stack: rt,
        loc,
      }),
  })

const spawn = (loc: Loc) => (rt: RuntimeContext): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings }) =>
      ctxSeq({
        bindings,
        stack: null,
        loc,
      }),
  })

export const forkFirst = (locations: Loc[]) => (
  rt: RuntimeContext
): ParallelRuntimeContext =>
  ctxParFirst({
    threads: locations.map((loc) => spawn(loc)(rt)),
    stack: rt,
  })

export const forkAll = (locations: Loc[]) => (
  rt: RuntimeContext
): ParallelRuntimeContext =>
  ctxParFirst({
    threads: locations.map((loc) => spawn(loc)(rt)),
    stack: rt,
  })

export const stepParallel = (newThreads: RuntimeContext[]) => (
  rt: ParallelRuntimeContext
): ParallelRuntimeContext =>
  match(rt, {
    'RuntimeContext.ParFirst': ({ stack }) =>
      ctxParFirst({
        threads: newThreads,
        stack,
      }),
    'RuntimeContext.ParAll': ({ stack }) =>
      ctxParAll({
        threads: newThreads,
        stack,
      }),
  })

export const stepSeq = (loc: Loc) => (rt: RuntimeContext): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ stack, bindings }) =>
      ctxSeq({
        bindings,
        stack,
        loc,
      }),
  })
