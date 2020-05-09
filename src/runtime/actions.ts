import Free from '../monad/free'

// Actions
type Action =
  | ActionDefineVar
  | ActionLookupVar
  | ActionExec
  | ActionForkFirst
  | ActionForkLast
  | ActionPromptChoice

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
interface ActionForkLast {
  kind: 'Action.ForkLast'
  branches: Interpreter<any>[]
}
interface ActionPromptChoice {
  kind: 'Action.PromptChoice'
  branches: PromptChoice[]
}

type PromptChoice = {
  label: string
  index: number
}

export type Interpreter<R> = Free<Action, R>

// Actions
export const empty: Interpreter<any> = Free.pure(null)

export const pure = <R>(v: R): Interpreter<R> => Free.pure(v)

// Variable lookup
export const defineVar = <R>(variable: string, value: any): Interpreter<R> =>
  Free.lift({ kind: 'Action.DefineVar', variable, value })

export const lookupVar = <R>(variable): Interpreter<R> =>
  Free.lift({ kind: 'Action.LookupVar', variable })

// Control Flow
export const forkFirst = <R>(branches: Interpreter<R>[]): Interpreter<R> =>
  Free.lift({ kind: 'Action.ForkFirst', branches })

export const forkLast = <R>(branches: Interpreter<R>[]): Interpreter<R> =>
  Free.lift({ kind: 'Action.ForkLast', branches })

export const promptChoice = <R>(branches: any[]): Interpreter<R> =>
  Free.lift({ kind: 'Action.PromptChoice', branches })

// User defined commands
export const exec = <R>({ fn, args }): Interpreter<R> =>
  Free.lift({ kind: 'Action.Exec', fn, args })
