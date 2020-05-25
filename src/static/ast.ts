import { Loc } from './location'

// ----------------------------------------------------------------------------
// AST Types
// ----------------------------------------------------------------------------

export type Prog = {
  commands: Cmd[]
}

// Commands
export type Cmd =
  | CmdExec
  | CmdRun
  | CmdDef
  | CmdChooseOne
  | CmdChooseAll
  | CmdForkFirst
  | CmdForkAll

export interface CmdExec {
  kind: 'Cmd.Exec'
  fn: string
  args: Expr[]
  loc?: Loc
}
export interface CmdRun {
  kind: 'Cmd.Run'
  expr: Expr
  loc?: Loc
}
export interface CmdDef {
  kind: 'Cmd.Def'
  variable: string
  value: Expr
  loc?: Loc
}
export interface CmdChooseOne {
  kind: 'Cmd.ChooseOne'
  branches: ChoiceBranch[]
  loc?: Loc
}
export interface CmdChooseAll {
  kind: 'Cmd.ChooseAll'
  branches: ChoiceBranch[]
  loc?: Loc
}
export interface CmdForkFirst {
  kind: 'Cmd.ForkFirst'
  branches: ForkBranch[]
  loc?: Loc
}
export interface CmdForkAll {
  kind: 'Cmd.ForkAll'
  branches: ForkBranch[]
  loc?: Loc
}

// Expressions
export type Expr = ExprVar | ExprLit | ExprCond | ExprCmd | ExprCmds

export interface ExprVar {
  kind: 'Expr.Var'
  variable: string
}
export interface ExprLit {
  kind: 'Expr.Lit'
  value: any
}
export interface ExprCond {
  kind: 'Expr.Cond'
  branches: CondBranch[]
}
export interface ExprCmd {
  kind: 'Expr.Cmd'
  cmd: Cmd
}
export interface ExprCmds {
  kind: 'Expr.Cmds'
  cmds: Cmd[]
}

// Branch types
export interface ChoiceBranch {
  kind: 'Branch.Choice'
  label: string
  cmdExpr: Expr
}

export interface ForkBranch {
  kind: 'Branch.Fork'
  cmdExpr: Expr
  loc?: Loc
}

export interface CondBranch {
  kind: 'Branch.Cond'
  condition: Expr
  result: Expr
}

// ----------------------------------------------------------------------------
// AST Builders
// ----------------------------------------------------------------------------

// Commands
export const Cmd = {
  Exec: ({ fn, args }): Cmd => ({ kind: 'Cmd.Exec', fn, args }),
  Run: (expr: Expr): Cmd => ({ kind: 'Cmd.Run', expr }),
  Def: ({ variable, value }): Cmd => ({ kind: 'Cmd.Def', variable, value }),
  ChooseOne: (branches: ChoiceBranch[]): Cmd => ({
    kind: 'Cmd.ChooseOne',
    branches,
  }),
  ChooseAll: (branches: ChoiceBranch[]): Cmd => ({
    kind: 'Cmd.ChooseAll',
    branches,
  }),
  ForkFirst: (branches: ForkBranch[]): Cmd => ({
    kind: 'Cmd.ForkFirst',
    branches,
  }),
  ForkAll: (branches: ForkBranch[]): Cmd => ({
    kind: 'Cmd.ForkAll',
    branches,
  }),
}

// Expressions
export const Expr = {
  Var: (variable: string): Expr => ({ kind: 'Expr.Var', variable }),
  Lit: (value: any): Expr => ({ kind: 'Expr.Lit', value }),
  Cond: (branches: CondBranch[]): Expr => ({ kind: 'Expr.Cond', branches }),
  Cmd: (cmd: Cmd): Expr => ({ kind: 'Expr.Cmd', cmd }),
  Cmds: (cmds: Cmd[]): Expr => ({ kind: 'Expr.Cmds', cmds }),
}

// Branch types
export const Branch = {
  Choice: ({ label, cmdExpr }): ChoiceBranch => ({
    kind: 'Branch.Choice',
    label,
    cmdExpr,
  }),
  Fork: (cmdExpr: Expr): ForkBranch => ({ kind: 'Branch.Fork', cmdExpr }),
  Cond: ({ condition, result }): CondBranch => ({
    kind: 'Branch.Cond',
    condition,
    result,
  }),
}
