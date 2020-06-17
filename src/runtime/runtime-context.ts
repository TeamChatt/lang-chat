import match from '../util/match'
import { Maybe } from '../data/maybe'
import { Loc, top, equals } from '../static/location'
import {
  BindingContext,
  empty as bindingEmpty,
  defineVar as bindingDefineVar,
  lookupVar as bindingLookupVar,
  union,
} from '../static/binding-context'
import { Result } from './interpreter'
import { Choice } from './choice'

export type RuntimeContext = CtxSeq | CtxParFirst | CtxParAll
export type ParallelRuntimeContext = CtxParFirst | CtxParAll
export type SequentialRuntimeContext = CtxSeq

interface CtxSeq {
  kind: 'RuntimeContext.Seq'
  bindings: BindingContext<Result>
  stack?: RuntimeContext
  choices?: Choice[]
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

const ctxSeq = ({
  bindings,
  stack,
  loc,
  choices = undefined,
}): RuntimeContext => ({
  kind: 'RuntimeContext.Seq',
  bindings,
  stack,
  loc,
  choices,
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
  loc: top,
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

export const lookupVar = (variable: string) => (
  rt: RuntimeContext
): Maybe<Result> =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings }) =>
      bindingLookupVar<Result>(variable)(bindings).maybe(
        (r) => Maybe.just(r),
        () =>
          rt.stack == null ? Maybe.nothing() : lookupVar(variable)(rt.stack)
      ),
  })

export const allBindings = (rt: RuntimeContext) =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings }) =>
      rt.stack ? union(allBindings(rt.stack), bindings) : bindings,
  })

export const popStack = (rt: RuntimeContext): RuntimeContext => rt.stack

export const pushStack = (rt: RuntimeContext): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ loc }) =>
      ctxSeq({
        bindings: bindingEmpty,
        stack: rt,
        loc,
      }),
  })

export const visitedBranches = (rt: RuntimeContext): Choice[] =>
  match(rt, {
    'RuntimeContext.Seq': ({ choices = [] }) => choices,
  })

export const visitBranch = (choice: Choice) => (
  rt: RuntimeContext
): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings, stack, loc, choices = [] }) =>
      ctxSeq({
        bindings,
        stack,
        loc,
        choices: [choice, ...choices],
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
  ctxParAll({
    threads: locations.map((loc) => spawn(loc)(rt)),
    stack: rt,
  })

export const stepParallel = (newThreads: RuntimeContext[]) => (
  rt: RuntimeContext
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
    'RuntimeContext.Seq': ({ stack, bindings, choices }) =>
      ctxSeq({
        bindings,
        stack,
        loc,
        choices: equals(loc)((rt as CtxSeq).loc) ? choices : [],
      }),
  })
