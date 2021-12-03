import { match, Matcher } from '../util/match'
import {
  Prog,
  Cmd,
  Expr,
  Branch,
  ChoiceBranch,
  ForkBranch,
  CondBranch,
} from './ast'

// prettier-ignore
type BranchTransformer = <T extends ChoiceBranch | ForkBranch | CondBranch>(
  branch: T
) => T extends ChoiceBranch ? ChoiceBranch
  : T extends ForkBranch ? ForkBranch
  : T extends CondBranch ? CondBranch
  : never

type Transformer = {
  Cmd: (cmd: Cmd) => Cmd
  Expr: (expr: Expr) => Expr
  Branch: BranchTransformer
}
type CmdVisitor = Matcher<Cmd, Cmd>
type ExprVisitor = Matcher<Expr, Expr>
type BranchVisitor = {
  'Branch.Choice': (branch: ChoiceBranch) => ChoiceBranch
  'Branch.Fork': (branch: ForkBranch) => ForkBranch
  'Branch.Cond': (branch: CondBranch) => CondBranch
}
type ASTVisitor = {
  Cmd?: Partial<CmdVisitor>
  Expr?: Partial<ExprVisitor>
  Branch?: Partial<BranchVisitor>
}

// Commands
const visitCmd = (transformer: Transformer): CmdVisitor => ({
  'Cmd.Exec': ({ fn, args }) =>
    Cmd.Exec({ fn, args: args.map(transformer.Expr) }),
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
  'Expr.Eval': ({ fn, args }) =>
    Expr.Eval({ fn, args: args.map(transformer.Expr) }),
  'Expr.Var': ({ variable }) => Expr.Var(variable),
  'Expr.Lit': ({ value }) => Expr.Lit(value),
  'Expr.Template': ({ parts }) => Expr.Template(parts.map(transformer.Expr)),
  'Expr.Unary': ({ op, expr }) =>
    Expr.Unary({ op, expr: transformer.Expr(expr) }),
  'Expr.Binary': ({ exprLeft, op, exprRight }) =>
    Expr.Binary({
      exprLeft: transformer.Expr(exprLeft),
      op,
      exprRight: transformer.Expr(exprRight),
    }),
  'Expr.Paren': ({ expr }) => Expr.Paren(transformer.Expr(expr)),
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
    Branch: ((branch: ChoiceBranch | ForkBranch | CondBranch) =>
      match(branch, {
        ...visitBranch(transformer),
        ...(visitor.Branch || {}),
      })) as unknown as BranchTransformer,
  }
  return transformer
}

// Program
export const transform =
  (visitor: ASTVisitor) =>
  ({ commands }: Prog): Prog => {
    const transformer: Transformer = makeTransformer(visitor)
    return { commands: commands.map(transformer.Cmd) }
  }
