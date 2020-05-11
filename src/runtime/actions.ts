import { Free } from '../monad/free'

// Actions
export type Action =
  | ActionDefineVar
  | ActionLookupVar
  | ActionExec
  | ActionForkFirst
  | ActionForkAll
  | ActionPromptChoice
  | ActionPushStack
  | ActionPopStack

interface ActionDefineVar {
  kind: 'Action.DefineVar'
  variable: string
  value: any
}
interface ActionLookupVar {
  kind: 'Action.LookupVar'
  variable: string
}
interface ActionExec {
  kind: 'Action.Exec'
  fn: string
  args: string[]
}
interface ActionForkFirst {
  kind: 'Action.ForkFirst'
  branches: Runtime<any>[]
}
interface ActionForkAll {
  kind: 'Action.ForkAll'
  branches: Runtime<any>[]
}
interface ActionPromptChoice {
  kind: 'Action.PromptChoice'
  branches: PromptChoice[]
}
interface ActionPushStack {
  kind: 'Action.PushStack'
}
interface ActionPopStack {
  kind: 'Action.PopStack'
}

type PromptChoice = {
  label: string
  index: number
}

export type Runtime<R> = Free<Action, R>

// Actions
export const empty: Runtime<any> = Free.pure(null)

export const pure = <R>(v: R): Runtime<R> => Free.pure(v)

// Variable lookup
export const defineVar = <R>(variable: string, value: any): Runtime<R> =>
  Free.lift({ kind: 'Action.DefineVar', variable, value })

export const lookupVar = <R>(variable): Runtime<R> =>
  Free.lift({ kind: 'Action.LookupVar', variable })

// Control Flow
const pushStack: Runtime<any> = Free.lift({ kind: 'Action.PushStack' })
const popStack: Runtime<any> = Free.lift({ kind: 'Action.PopStack' })

export const scoped = <R>(action: Runtime<R>) =>
  pushStack.flatMap(() => action).flatMap(() => popStack)

export const forkFirst = <R>(branches: Runtime<R>[]): Runtime<R> =>
  Free.lift({ kind: 'Action.ForkFirst', branches })

export const forkAll = <R>(branches: Runtime<R>[]): Runtime<R> =>
  Free.lift({ kind: 'Action.ForkAll', branches })

export const promptChoice = <R>(branches: any[]): Runtime<R> =>
  Free.lift({ kind: 'Action.PromptChoice', branches })

// User defined commands
export const exec = <R>({ fn, args }): Runtime<R> =>
  Free.lift({ kind: 'Action.Exec', fn, args })
