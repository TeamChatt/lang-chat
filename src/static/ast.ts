import { Loc } from './location'

export type Prog = {
  commands: Cmd[]
}

// Commands
export const Cmd = {
  Exec: ({ fn, args }): CmdExec => ({ kind: 'Cmd.Exec', fn, args }),
  Run: (expr: Expr): CmdRun => ({ kind: 'Cmd.Run', expr }),
  Def: ({ variable, value }): CmdDef => ({ kind: 'Cmd.Def', variable, value }),
  ChooseOne: (branches: ChoiceBranch[]): CmdChooseOne => ({
    kind: 'Cmd.ChooseOne',
    branches,
  }),
  ChooseAll: (branches: ChoiceBranch[]): CmdChooseAll => ({
    kind: 'Cmd.ChooseAll',
    branches,
  }),
  ForkFirst: (branches: ForkBranch[]): CmdForkFirst => ({
    kind: 'Cmd.ForkFirst',
    branches,
  }),
  ForkAll: (branches: ForkBranch[]): CmdForkAll => ({
    kind: 'Cmd.ForkAll',
    branches,
  }),
}

export type Cmd =
  | CmdExec
  | CmdRun
  | CmdDef
  | CmdChooseOne
  | CmdChooseAll
  | CmdForkFirst
  | CmdForkAll

interface CmdExec {
  kind: 'Cmd.Exec'
  fn: string
  args: Expr[]
  loc?: Loc
}
interface CmdRun {
  kind: 'Cmd.Run'
  expr: Expr
  loc?: Loc
}
interface CmdDef {
  kind: 'Cmd.Def'
  variable: string
  value: Expr
  loc?: Loc
}
interface CmdChooseOne {
  kind: 'Cmd.ChooseOne'
  branches: ChoiceBranch[]
  loc?: Loc
}
interface CmdChooseAll {
  kind: 'Cmd.ChooseAll'
  branches: ChoiceBranch[]
  loc?: Loc
}
interface CmdForkFirst {
  kind: 'Cmd.ForkFirst'
  branches: ForkBranch[]
  loc?: Loc
}
interface CmdForkAll {
  kind: 'Cmd.ForkAll'
  branches: ForkBranch[]
  loc?: Loc
}

// Expressions
export const Expr = {
  Var: (variable: string): ExprVar => ({ kind: 'Expr.Var', variable }),
  Lit: (value: any): ExprLit => ({ kind: 'Expr.Lit', value }),
  Cond: (branches: CondBranch[]): ExprCond => ({ kind: 'Expr.Cond', branches }),
  Cmd: (cmd: Cmd): ExprCmd => ({ kind: 'Expr.Cmd', cmd }),
  Cmds: (cmds: Cmd[]): ExprCmds => ({ kind: 'Expr.Cmds', cmds }),
}

export type Expr = ExprVar | ExprLit | ExprCond | ExprCmd | ExprCmds

interface ExprVar {
  kind: 'Expr.Var'
  variable: string
}
interface ExprLit {
  kind: 'Expr.Lit'
  value: any
}
interface ExprCond {
  kind: 'Expr.Cond'
  branches: CondBranch[]
}
interface ExprCmd {
  kind: 'Expr.Cmd'
  cmd: Cmd
}
interface ExprCmds {
  kind: 'Expr.Cmds'
  cmds: Cmd[]
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

interface ChoiceBranch {
  kind: 'Branch.Choice'
  label: string
  cmdExpr: Expr
}

interface ForkBranch {
  kind: 'Branch.Fork'
  cmdExpr: Expr
  loc?: Loc
}

interface CondBranch {
  kind: 'Branch.Cond'
  condition: Expr
  result: Expr
}
