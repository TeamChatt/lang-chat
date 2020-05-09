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
  ForkLast: (branches: ForkBranch[]): CmdForkLast => ({
    kind: 'Cmd.ForkLast',
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
  | CmdForkLast

interface CmdExec {
  kind: 'Cmd.Exec'
  fn: string
  args: Expr[]
}
interface CmdRun {
  kind: 'Cmd.Run'
  expr: Expr
}
interface CmdDef {
  kind: 'Cmd.Def'
  variable: string
  value: Expr
}
interface CmdChooseOne {
  kind: 'Cmd.ChooseOne'
  branches: ChoiceBranch[]
}
interface CmdChooseAll {
  kind: 'Cmd.ChooseAll'
  branches: ChoiceBranch[]
}
interface CmdForkFirst {
  kind: 'Cmd.ForkFirst'
  branches: ForkBranch[]
}
interface CmdForkLast {
  kind: 'Cmd.ForkLast'
  branches: ForkBranch[]
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
  Choice: ({ label, cmds }): ChoiceBranch => ({
    kind: 'Branch.Choice',
    label,
    cmds,
  }),
  Fork: (cmds: Cmd[]): ForkBranch => ({ kind: 'Branch.Fork', cmds }),
  Cond: ({ condition, result }): CondBranch => ({
    kind: 'Branch.Cond',
    condition,
    result,
  }),
}

interface ChoiceBranch {
  kind: 'Branch.Choice'
  label: string
  cmds: Cmd[]
}

interface ForkBranch {
  kind: 'Branch.Fork'
  cmds: Cmd[]
}

interface CondBranch {
  kind: 'Branch.Cond'
  condition: Expr
  result: Expr
}
