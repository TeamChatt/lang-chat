import { Free } from '../monad/free'
import { Cmd } from '../static/ast'

// Result types
export const Result = {
  Lit: (value: any) => ({ kind: 'Result.Lit', value }),
  Cmd: (cmd: Cmd) => ({ kind: 'Result.Cmd', cmd }),
  Cmds: (cmds: Cmd[]) => ({ kind: 'Result.Cmds', cmds }),
}
export type Result = ResultLit | ResultCmd | ResultCmds

interface ResultLit {
  kind: 'Result.Lit'
  value: any
}
interface ResultCmd {
  kind: 'Result.Cmd'
  cmd: Cmd
}
interface ResultCmds {
  kind: 'Result.Cmds'
  cmds: Cmd[]
}

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
  branches: Interpreter<any>[]
}
interface ActionForkAll {
  kind: 'Action.ForkAll'
  branches: Interpreter<any>[]
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

// Action creators
export type Interpreter<R> = Free<Action, R>

export const empty: Interpreter<any> = Free.pure(null)

export const pure = <R>(v: R): Interpreter<R> => Free.pure(v)

// Variable lookup
export const defineVar = <R>(variable: string, value: any): Interpreter<R> =>
  Free.lift({ kind: 'Action.DefineVar', variable, value })

export const lookupVar = <R>(variable): Interpreter<R> =>
  Free.lift({ kind: 'Action.LookupVar', variable })

// Control Flow
const pushStack: Interpreter<any> = Free.lift({ kind: 'Action.PushStack' })
const popStack: Interpreter<any> = Free.lift({ kind: 'Action.PopStack' })

export const scoped = <R>(action: Interpreter<R>) =>
  pushStack.flatMap(() => action).flatMap(() => popStack)

export const forkFirst = <R>(branches: Interpreter<R>[]): Interpreter<R> =>
  Free.lift({ kind: 'Action.ForkFirst', branches })

export const forkAll = <R>(branches: Interpreter<R>[]): Interpreter<R> =>
  Free.lift({ kind: 'Action.ForkAll', branches })

export const promptChoice = <R>(branches: any[]): Interpreter<R> =>
  Free.lift({ kind: 'Action.PromptChoice', branches })

// User defined commands
export const exec = <R>({ fn, args }): Interpreter<R> =>
  Free.lift({ kind: 'Action.Exec', fn, args })
