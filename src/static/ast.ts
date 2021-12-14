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
  | CmdReturn
  | CmdDef
  | CmdDialogue
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
export interface CmdReturn {
  kind: 'Cmd.Return'
  expr: Expr
  loc?: Loc
}
export interface CmdDef {
  kind: 'Cmd.Def'
  variable: string
  value: Expr
  loc?: Loc
}
export interface CmdDialogue {
  kind: 'Cmd.Dialogue'
  character: string
  line: Expr
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
export type Expr =
  | ExprImport
  | ExprVar
  | ExprLit
  | ExprTemplate
  | ExprUnary
  | ExprBinary
  | ExprParen
  | ExprCond
  | ExprCmd
  | ExprCmds
  | ExprResult

export interface ExprImport {
  kind: 'Expr.Import'
  path: string
}
export interface ExprVar {
  kind: 'Expr.Var'
  variable: string
}
export interface ExprLit {
  kind: 'Expr.Lit'
  value: any
}
export interface ExprTemplate {
  kind: 'Expr.Template'
  parts: Expr[]
}
export interface ExprUnary {
  kind: 'Expr.Unary'
  op: string
  expr: Expr
}
export interface ExprBinary {
  kind: 'Expr.Binary'
  op: string
  exprLeft: Expr
  exprRight: Expr
}
export interface ExprParen {
  kind: 'Expr.Paren'
  expr: Expr
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
export interface ExprResult {
  kind: 'Expr.Result'
  cmdExpr: Expr
}

// Branch types
export interface ChoiceBranch {
  kind: 'Branch.Choice'
  label: string
  cmdExpr: Expr
  loc?: Loc
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
  loc?: Loc
}

// ----------------------------------------------------------------------------
// AST Builders
// ----------------------------------------------------------------------------

// Commands
export const Cmd = {
  Exec: ({ fn, args }): Cmd => ({ kind: 'Cmd.Exec', fn, args }),
  Run: (expr: Expr): Cmd => ({ kind: 'Cmd.Run', expr }),
  Return: (expr): Cmd => ({ kind: 'Cmd.Return', expr }),
  Dialogue: ({ character, line }): Cmd => ({
    kind: 'Cmd.Dialogue',
    character,
    line,
  }),
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
  Import: (path: string): Expr => ({ kind: 'Expr.Import', path }),
  Var: (variable: string): Expr => ({ kind: 'Expr.Var', variable }),
  Lit: (value: any): Expr => ({ kind: 'Expr.Lit', value }),
  Template: (parts: Expr[]): Expr => ({ kind: 'Expr.Template', parts }),
  Unary: ({ op, expr }): Expr => ({ kind: 'Expr.Unary', op, expr }),
  Binary: ({ op, exprLeft, exprRight }): Expr => ({
    kind: 'Expr.Binary',
    op,
    exprLeft,
    exprRight,
  }),
  Paren: (expr: Expr): Expr => ({ kind: 'Expr.Paren', expr }),
  Cond: (branches: CondBranch[]): Expr => ({ kind: 'Expr.Cond', branches }),
  Cmd: (cmd: Cmd): Expr => ({ kind: 'Expr.Cmd', cmd }),
  Cmds: (cmds: Cmd[]): Expr => ({ kind: 'Expr.Cmds', cmds }),
  Result: (cmdExpr: Expr): Expr => ({ kind: 'Expr.Result', cmdExpr }),
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
