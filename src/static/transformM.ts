import match from '../util/match'
import {
  Prog,
  Cmd,
  Expr,
  Branch,
  ChoiceBranch,
  ForkBranch,
  CondBranch,
} from './ast'

interface Monad<T> {
  map<S>(f: (t: T) => S): Monad<S>
  flatten<S>(): Monad<S>
  flatMap<S>(f: (t: T) => Monad<S>): Monad<S>
}

export const transformM = (of: <T>(t: T) => Monad<T>) => {
  const sequenceM = <T>(arrM: Monad<T>[]): Monad<T[]> =>
    arrM.reduce(
      (arrM, valM) =>
        arrM.flatMap((arr) => valM.flatMap((val) => of([...arr, val]))),
      of([] as T[])
    )

  type Transformer = {
    Cmd: (cmd: Cmd) => Monad<Cmd>
    Expr: (expr: Expr) => Monad<Expr>
    Branch: (branch: any) => Monad<any>
  }
  type CmdVisitor = {
    'Cmd.Exec'?: (cmd: any) => Monad<Cmd>
    'Cmd.Run'?: (cmd: any) => Monad<Cmd>
    'Cmd.Def'?: (cmd: any) => Monad<Cmd>
    'Cmd.Dialogue'?: (cmd: any) => Monad<Cmd>
    'Cmd.ChooseOne'?: (cmd: any) => Monad<Cmd>
    'Cmd.ChooseAll'?: (cmd: any) => Monad<Cmd>
    'Cmd.ForkFirst'?: (cmd: any) => Monad<Cmd>
    'Cmd.ForkAll'?: (cmd: any) => Monad<Cmd>
  }
  type ExprVisitor = {
    'Expr.Import'?: (expr: any) => Monad<Expr>
    'Expr.Eval'?: (expr: any) => Monad<Expr>
    'Expr.Var'?: (expr: any) => Monad<Expr>
    'Expr.Lit'?: (expr: any) => Monad<Expr>
    'Expr.Template'?: (expr: any) => Monad<Expr>
    'Expr.Unary'?: (expr: any) => Monad<Expr>
    'Expr.Binary'?: (expr: any) => Monad<Expr>
    'Expr.Paren'?: (expr: any) => Monad<Expr>
    'Expr.Cond'?: (expr: any) => Monad<Expr>
    'Expr.Cmd'?: (expr: any) => Monad<Expr>
    'Expr.Cmds'?: (expr: any) => Monad<Expr>
  }
  type BranchVisitor = {
    'Branch.Choice'?: (branch: any) => Monad<any>
    'Branch.Fork'?: (branch: any) => Monad<any>
    'Branch.Cond'?: (branch: any) => Monad<any>
  }
  type ASTVisitor = {
    Cmd?: CmdVisitor
    Expr?: ExprVisitor
    Branch?: BranchVisitor
  }

  // Commands
  const visitCmd = (transformer: Transformer): CmdVisitor => ({
    'Cmd.Exec': ({ fn, args }) => of(Cmd.Exec({ fn, args })),
    'Cmd.Run': ({ expr }) =>
      transformer.Expr(expr).map((expr) => Cmd.Run(expr)),
    'Cmd.Def': ({ variable, value }) =>
      transformer.Expr(value).map((value) =>
        Cmd.Def({
          variable,
          value,
        })
      ),
    'Cmd.Dialogue': ({ character, line }) =>
      of(Cmd.Dialogue({ character, line })),
    'Cmd.ChooseOne': ({ branches }) =>
      sequenceM<ChoiceBranch>(
        branches.map(transformer.Branch)
      ).map((branches) => Cmd.ChooseOne(branches)),
    'Cmd.ChooseAll': ({ branches }) =>
      sequenceM<ChoiceBranch>(
        branches.map(transformer.Branch)
      ).map((branches) => Cmd.ChooseAll(branches)),
    'Cmd.ForkFirst': ({ branches }) =>
      sequenceM<ForkBranch>(branches.map(transformer.Branch)).map((branches) =>
        Cmd.ForkFirst(branches)
      ),
    'Cmd.ForkAll': ({ branches }) =>
      sequenceM<ForkBranch>(branches.map(transformer.Branch)).map((branches) =>
        Cmd.ForkAll(branches)
      ),
  })

  // Expressions
  const visitExpr = (transformer: Transformer): ExprVisitor => ({
    'Expr.Import': ({ path }) => of(Expr.Import(path)),
    'Expr.Eval': ({ fn, args }) =>
      sequenceM<CondBranch>(args.map(transformer.Expr)).map((args) =>
        Expr.Eval({ fn, args })
      ),

    'Expr.Var': ({ variable }) => of(Expr.Var(variable)),
    'Expr.Lit': ({ value }) => of(Expr.Lit(value)),
    'Expr.Template': ({ parts }) =>
      sequenceM<Expr>(parts.map(transformer.Expr)).map((parts) =>
        Expr.Template(parts)
      ),
    'Expr.Unary': ({ op, expr }) =>
      transformer.Expr(expr).map((expr) => Expr.Unary({ op, expr })),
    'Expr.Binary': ({ exprLeft, op, exprRight }) => {
      const exprLeftM = transformer.Expr(exprLeft)
      const exprRightM = transformer.Expr(exprRight)
      return exprLeftM.flatMap((exprLeft) =>
        exprRightM.map((exprRight) => Expr.Binary({ exprLeft, op, exprRight }))
      )
    },
    'Expr.Paren': ({ expr }) =>
      transformer.Expr(expr).map((expr) => Expr.Paren(expr)),
    'Expr.Cond': ({ branches }) =>
      sequenceM<CondBranch>(branches.map(transformer.Branch)).map((branches) =>
        Expr.Cond(branches)
      ),
    'Expr.Cmd': ({ cmd }) => transformer.Cmd(cmd).map((cmd) => Expr.Cmd(cmd)),
    'Expr.Cmds': ({ cmds }) =>
      sequenceM<Cmd>(cmds.map(transformer.Cmd)).map((cmds) => Expr.Cmds(cmds)),
  })

  // Branch types
  const visitBranch = (transformer: Transformer): BranchVisitor => ({
    'Branch.Choice': ({ label, cmdExpr }) =>
      transformer.Expr(cmdExpr).map((cmdExpr) =>
        Branch.Choice({
          label,
          cmdExpr,
        })
      ),
    'Branch.Fork': ({ cmdExpr }) =>
      transformer.Expr(cmdExpr).map((cmdExpr) => Branch.Fork(cmdExpr)),
    'Branch.Cond': ({ condition, result }) => {
      const condM = transformer.Expr(condition)
      const resultM = transformer.Expr(result)
      return condM.flatMap((condition) =>
        resultM.flatMap((result) => of(Branch.Cond({ condition, result })))
      )
    },
  })

  const makeTransformer = (visitor: ASTVisitor): Transformer => {
    const transducer: Transformer = {
      Cmd: (cmd: Cmd) =>
        match(cmd, {
          ...visitCmd(transducer),
          ...(visitor.Cmd || {}),
        }).map((cmdResult) => ({
          ...(cmd.loc ? { loc: cmd.loc } : {}),
          ...cmdResult,
        })),
      Expr: (expr: Expr) =>
        match(expr, {
          ...visitExpr(transducer),
          ...(visitor.Expr || {}),
        }),
      Branch: (branch: any) =>
        match(branch, {
          ...visitBranch(transducer),
          ...(visitor.Branch || {}),
        }).map((cmdResult) => ({
          ...(branch.loc ? { loc: branch.loc } : {}),
          ...cmdResult,
        })),
    }
    return transducer
  }

  // Program
  const runTransformM = (visitor: ASTVisitor) => ({
    commands,
  }: Prog): Monad<Prog> => {
    const transformer = makeTransformer(visitor)
    return sequenceM<Cmd>(commands.map(transformer.Cmd)).flatMap((commands) =>
      of({ commands })
    )
  }

  return runTransformM
}
