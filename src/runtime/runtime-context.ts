import { matchOr } from '../util/match'
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

export const defineVar =
  (variable: string, value: Result) =>
  (rt: RuntimeContext): RuntimeContext =>
    matchOr(rt, {
      'RuntimeContext.Seq': ({ bindings, stack, loc }) =>
        ctxSeq({
          bindings: bindingDefineVar(variable, value)(bindings),
          stack,
          loc,
        }),
      default: () => {
        throw new Error(`Can't define variable in concurrent context`)
      },
    })

export const lookupVar =
  (variable: string) =>
  (rt: RuntimeContext): Maybe<Result> =>
    matchOr(rt, {
      'RuntimeContext.Seq': ({ bindings }) =>
        bindingLookupVar<Result>(variable)(bindings).maybe(
          (r) => Maybe.just(r),
          () =>
            rt.stack == null
              ? Maybe.nothing<Result>()
              : lookupVar(variable)(rt.stack)
        ),
      default: () => {
        throw new Error(`Can't lookup variable in concurrent context`)
      },
    })

export const allBindings = (rt: RuntimeContext) =>
  matchOr(rt, {
    'RuntimeContext.Seq': ({ bindings }) =>
      rt.stack ? union(allBindings(rt.stack), bindings) : bindings,
    default: () => {
      throw new Error(`Can't get bindings in concurrent context`)
    },
  })

export const popStack = (rt: RuntimeContext): RuntimeContext => rt.stack

export const pushStack = (rt: RuntimeContext): RuntimeContext =>
  matchOr(rt, {
    'RuntimeContext.Seq': ({ loc }) =>
      ctxSeq({
        bindings: bindingEmpty,
        stack: rt,
        loc,
      }),
    default: () => {
      throw new Error(`Can't push stack in concurrent context`)
    },
  })

export const visitedBranches = (rt: RuntimeContext): Choice[] =>
  matchOr(rt, {
    'RuntimeContext.Seq': ({ choices = [] }) => choices,
    default: () => {
      throw new Error(`Can't read choices from concurrent context`)
    },
  })

export const visitBranch =
  (choice: Choice) =>
  (rt: RuntimeContext): RuntimeContext =>
    matchOr(rt, {
      'RuntimeContext.Seq': ({ bindings, stack, loc, choices = [] }) =>
        ctxSeq({
          bindings,
          stack,
          loc,
          choices: [choice, ...choices],
        }),
      default: () => {
        throw new Error(`Can't choose branch from concurrent context`)
      },
    })

const spawn =
  (loc: Loc) =>
  (rt: RuntimeContext): RuntimeContext =>
    matchOr(rt, {
      'RuntimeContext.Seq': () =>
        ctxSeq({
          bindings: allBindings(rt),
          stack: null,
          loc,
        }),
      default: () => {
        throw new Error(`Can't spawn from from concurrent context`)
      },
    })

export const forkFirst =
  (locations: Loc[]) =>
  (rt: RuntimeContext): ParallelRuntimeContext =>
    ctxParFirst({
      threads: locations.map((loc) => spawn(loc)(rt)),
      stack: rt,
    })

export const forkAll =
  (locations: Loc[]) =>
  (rt: RuntimeContext): ParallelRuntimeContext =>
    ctxParAll({
      threads: locations.map((loc) => spawn(loc)(rt)),
      stack: rt,
    })

export const stepParallel =
  (newThreads: RuntimeContext[]) =>
  (rt: RuntimeContext): ParallelRuntimeContext =>
    matchOr(rt, {
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
      default: () => {
        throw new Error(`Can't step parallel from sequential context`)
      },
    })

export const stepSeq =
  (loc: Loc) =>
  (rt: RuntimeContext): RuntimeContext =>
    matchOr(rt, {
      'RuntimeContext.Seq': ({ stack, bindings, choices }) =>
        ctxSeq({
          bindings,
          stack,
          loc,
          choices: equals(loc)((rt as CtxSeq).loc) ? choices : [],
        }),
      default: () => {
        throw new Error(`Can't step sequential from concurrent context`)
      },
    })
