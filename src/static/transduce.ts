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
import { ASTContext, pure, withKey, withArray } from './ast-context'

type Transducer = {
  Cmd: (cmd: Cmd) => ASTContext<Cmd>
  Expr: (expr: Expr) => ASTContext<Expr>
  Branch: (
    branch: ChoiceBranch | ForkBranch | CondBranch
  ) => ASTContext<ChoiceBranch | ForkBranch | CondBranch>
}
type CmdVisitor = Matcher<Cmd, ASTContext<Cmd>>
type ExprVisitor = Matcher<Expr, ASTContext<Expr>>
type BranchVisitor = {
  'Branch.Choice': (branch: ChoiceBranch) => ASTContext<ChoiceBranch>
  'Branch.Fork': (branch: ForkBranch) => ASTContext<ForkBranch>
  'Branch.Cond': (branch: CondBranch) => ASTContext<CondBranch>
}
type ASTVisitor = {
  Cmd?: Partial<CmdVisitor>
  Expr?: Partial<ExprVisitor>
  Branch?: Partial<BranchVisitor>
}

// Commands
const visitCmd = (transducer: Transducer): CmdVisitor => ({
  'Cmd.Exec': ({ fn, args }) =>
    withArray('args', args.map(transducer.Expr)).map((args) =>
      Cmd.Exec({ fn, args })
    ),
  'Cmd.Run': ({ expr }) => withKey('expr', transducer.Expr(expr)).map(Cmd.Run),
  'Cmd.Def': ({ variable, value }) =>
    withKey('value', transducer.Expr(value)).map((value) =>
      Cmd.Def({
        variable,
        value,
      })
    ),
  'Cmd.Return': ({ expr }) =>
    withKey('expr', transducer.Expr(expr)).map(Cmd.Return),
  'Cmd.Dialogue': ({ character, line }) =>
    pure(Cmd.Dialogue({ character, line })),
  'Cmd.ChooseOne': ({ branches }) =>
    withArray('branches', branches.map(transducer.Branch)).map(Cmd.ChooseOne),
  'Cmd.ChooseAll': ({ branches }) =>
    withArray('branches', branches.map(transducer.Branch)).map(Cmd.ChooseAll),
  'Cmd.ForkFirst': ({ branches }) =>
    withArray('branches', branches.map(transducer.Branch)).map(Cmd.ForkFirst),
  'Cmd.ForkAll': ({ branches }) =>
    withArray('branches', branches.map(transducer.Branch)).map(Cmd.ForkAll),
})

// Expressions
const visitExpr = (transducer: Transducer): ExprVisitor => ({
  'Expr.Import': ({ path }) => pure(Expr.Import(path)),
  'Expr.Eval': ({ fn, args }) =>
    withArray('args', args.map(transducer.Expr)).map((args) =>
      Expr.Eval({ fn, args })
    ),
  'Expr.Var': ({ variable }) => pure(Expr.Var(variable)),
  'Expr.Lit': ({ value }) => pure(Expr.Lit(value)),
  'Expr.Template': ({ parts }) =>
    withArray<Expr>('parts', parts.map(transducer.Expr)).map(Expr.Template),
  'Expr.Unary': ({ op, expr }) =>
    withKey('expr', transducer.Expr(expr)).map((expr) =>
      Expr.Unary({ op, expr })
    ),
  'Expr.Binary': ({ exprLeft, op, exprRight }) => {
    const exprLeftM = withKey('exprLeft', transducer.Expr(exprLeft))
    const exprRightM = withKey('exprRight', transducer.Expr(exprRight))
    return exprLeftM.flatMap((exprLeft) =>
      exprRightM.map((exprRight) => Expr.Binary({ exprLeft, op, exprRight }))
    )
  },
  'Expr.Paren': ({ expr }) =>
    withKey('expr', transducer.Expr(expr)).map(Expr.Paren),
  'Expr.Cond': ({ branches }) =>
    withArray('branches', branches.map(transducer.Branch)).map(Expr.Cond),
  'Expr.Cmd': ({ cmd }) => withKey('cmd', transducer.Cmd(cmd)).map(Expr.Cmd),
  'Expr.Cmds': ({ cmds }) =>
    withArray<Cmd>('cmds', cmds.map(transducer.Cmd)).map(Expr.Cmds),
  'Expr.Result': ({ cmdExpr }) =>
    withKey('cmdExpr', transducer.Expr(cmdExpr)).map(Expr.Result),
})

// Branch types
const visitBranch = (transducer: Transducer): BranchVisitor => ({
  'Branch.Choice': ({ label, cmdExpr }) =>
    withKey('cmdExpr', transducer.Expr(cmdExpr)).map((cmdExpr) =>
      Branch.Choice({
        label,
        cmdExpr,
      })
    ),
  'Branch.Fork': ({ cmdExpr }) =>
    withKey('cmdExpr', transducer.Expr(cmdExpr)).map((cmdExpr) =>
      Branch.Fork(cmdExpr)
    ),
  'Branch.Cond': ({ condition, result }) => {
    const condM = withKey('condition', transducer.Expr(condition))
    const resultM = withKey('result', transducer.Expr(result))
    return condM.flatMap((condition) =>
      resultM.flatMap((result) => pure(Branch.Cond({ condition, result })))
    )
  },
})

export const makeTransducer = (visitor: ASTVisitor): Transducer => {
  const transducer: Transducer = {
    Cmd: (cmd: Cmd) =>
      match(cmd, {
        ...visitCmd(transducer),
        ...(visitor.Cmd || {}),
      }),
    Expr: (expr: Expr) =>
      match(expr, {
        ...visitExpr(transducer),
        ...(visitor.Expr || {}),
      }),
    Branch: (branch: ChoiceBranch | ForkBranch | CondBranch) =>
      match(branch, {
        ...visitBranch(transducer),
        ...(visitor.Branch || {}),
      }),
  }
  return transducer
}

// Program
export const transduce =
  (transducer: Transducer) =>
  ({ commands }: Prog): ASTContext<Prog> =>
    withArray('commands', commands.map(transducer.Cmd)).flatMap((commands) =>
      pure({ commands })
    )
