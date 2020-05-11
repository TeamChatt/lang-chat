export type BindingContext = {}

export type RuntimeContext = CtxSeq | CtxParFirst | CtxParAll

interface CtxSeq {
  kind: 'RuntimeContext.Seq'
  bindings: BindingContext
  stack?: RuntimeContext
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

const match = (obj, cases) => cases[obj.kind](obj)

export const ctxSeq = ({ bindings, stack }): RuntimeContext => ({
  kind: 'RuntimeContext.Seq',
  bindings,
  stack,
})

export const ctxParFirst = ({ threads, stack }): RuntimeContext => ({
  kind: 'RuntimeContext.ParFirst',
  threads,
  stack,
})

export const ctxParAll = ({ threads, stack }): RuntimeContext => ({
  kind: 'RuntimeContext.ParAll',
  threads,
  stack,
})

export const popStack = (rt: RuntimeContext): RuntimeContext => rt.stack

export const pushStack = (rt: RuntimeContext): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings }) => ({
      kind: 'RuntimeContext.Seq',
      bindings,
      stack: rt,
    }),
  })

export const spawn = (rt: RuntimeContext): RuntimeContext =>
  match(rt, {
    'RuntimeContext.Seq': ({ bindings }) => ({
      kind: 'RuntimeContext.Seq',
      bindings,
      stack: null,
    }),
  })
