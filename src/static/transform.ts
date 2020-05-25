import match from '../util/match'
import { Prog, Cmd, Expr, Branch } from './ast'

type Transformer = {
  Cmd: (cmd: Cmd) => Cmd
  Expr: (expr: Expr) => Expr
  Branch: (branch: any) => any
}
type CmdVisitor = {
  'Cmd.Exec'?: (cmd: any) => Cmd
  'Cmd.Run'?: (cmd: any) => Cmd
  'Cmd.Def'?: (cmd: any) => Cmd
  'Cmd.Dialogue'?: (cmd: any) => Cmd
  'Cmd.ChooseOne'?: (cmd: any) => Cmd
  'Cmd.ChooseAll'?: (cmd: any) => Cmd
  'Cmd.ForkFirst'?: (cmd: any) => Cmd
  'Cmd.ForkAll'?: (cmd: any) => Cmd
}
type ExprVisitor = {
  'Expr.Import'?: (expr: any) => Expr
  'Expr.Var'?: (expr: any) => Expr
  'Expr.Lit'?: (expr: any) => Expr
  'Expr.Cond'?: (expr: any) => Expr
  'Expr.Cmd'?: (expr: any) => Expr
  'Expr.Cmds'?: (expr: any) => Expr
}
type BranchVisitor = {
  'Branch.Choice'?: (branch: any) => any
  'Branch.Fork'?: (branch: any) => any
  'Branch.Cond'?: (branch: any) => any
}
type ASTVisitor = {
  Cmd?: CmdVisitor
  Expr?: ExprVisitor
  Branch?: BranchVisitor
}

// Commands
const visitCmd = (transformer: Transformer): CmdVisitor => ({
  'Cmd.Exec': ({ fn, args }) => Cmd.Exec({ fn, args }),
  'Cmd.Run': ({ expr }) => Cmd.Run(transformer.Expr(expr)),
  'Cmd.Def': ({ variable, value }) =>
    Cmd.Def({
      variable,
      value: transformer.Expr(value),
    }),
  'Cmd.Dialogue': ({ character, line }) => Cmd.Dialogue({ character, line }),
  'Cmd.ChooseOne': ({ branches }) =>
    Cmd.ChooseOne(branches.map(transformer.Branch)),
  'Cmd.ChooseAll': ({ branches }) =>
    Cmd.ChooseAll(branches.map(transformer.Branch)),
  'Cmd.ForkFirst': ({ branches }) =>
    Cmd.ForkFirst(branches.map(transformer.Branch)),
  'Cmd.ForkAll': ({ branches }) =>
    Cmd.ForkAll(branches.map(transformer.Branch)),
})

// Expressions
const visitExpr = (transformer: Transformer): ExprVisitor => ({
  'Expr.Import': ({ path }) => Expr.Import(path),
  'Expr.Var': ({ variable }) => Expr.Var(variable),
  'Expr.Lit': ({ value }) => Expr.Lit(value),
  'Expr.Cond': ({ branches }) => Expr.Cond(branches.map(transformer.Branch)),
  'Expr.Cmd': ({ cmd }) => Expr.Cmd(transformer.Cmd(cmd)),
  'Expr.Cmds': ({ cmds }) => Expr.Cmds(cmds.map(transformer.Cmd)),
})

// Branch types
const visitBranch = (transformer: Transformer): BranchVisitor => ({
  'Branch.Choice': ({ label, cmdExpr }) =>
    Branch.Choice({
      label,
      cmdExpr: transformer.Expr(cmdExpr),
    }),
  'Branch.Fork': ({ cmdExpr }) => Branch.Fork(transformer.Expr(cmdExpr)),
  'Branch.Cond': ({ condition, result }) =>
    Branch.Cond({
      condition: transformer.Expr(condition),
      result: transformer.Expr(result),
    }),
})

const makeTransformer = (visitor: ASTVisitor): Transformer => {
  const transformer: Transformer = {
    Cmd: (cmd: Cmd) =>
      match(cmd, {
        ...visitCmd(transformer),
        ...(visitor.Cmd || {}),
      }),
    Expr: (expr: Expr) =>
      match(expr, {
        ...visitExpr(transformer),
        ...(visitor.Expr || {}),
      }),
    Branch: (branch: any) =>
      match(branch, {
        ...visitBranch(transformer),
        ...(visitor.Branch || {}),
      }),
  }
  return transformer
}

// Program
const transform = (visitor: ASTVisitor) => ({ commands }: Prog): Prog => {
  const transformer: Transformer = makeTransformer(visitor)
  return { commands: commands.map(transformer.Cmd) }
}

export default transform
