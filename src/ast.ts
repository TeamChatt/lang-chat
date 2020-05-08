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
interface ChoiceBranch {
  kind: 'Branch.Choice'
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
