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

interface Monad<T> {
  map<S>(f: (t: T) => S): Monad<S>
  flatMap<S>(f: (t: T) => Monad<S>): Monad<S>
}

// prettier-ignore
type BranchTransformer = <T extends ChoiceBranch | ForkBranch | CondBranch>(
  branch: T
) => T extends ChoiceBranch ? Monad<ChoiceBranch>
  : T extends ForkBranch ? Monad<ForkBranch>
  : T extends CondBranch ? Monad<CondBranch>
  : never

type Transformer = {
  Cmd: (cmd: Cmd) => Monad<Cmd>
  Expr: (expr: Expr) => Monad<Expr>
  Branch: BranchTransformer
}
type CmdVisitor = Matcher<Cmd, Monad<Cmd>>
type ExprVisitor = Matcher<Expr, Monad<Expr>>
type BranchVisitor = {
  'Branch.Choice': (branch: ChoiceBranch) => Monad<ChoiceBranch>
  'Branch.Fork': (branch: ForkBranch) => Monad<ForkBranch>
  'Branch.Cond': (branch: CondBranch) => Monad<CondBranch>
}
type ASTVisitor = {
  Cmd?: Partial<CmdVisitor>
  Expr?: Partial<ExprVisitor>
  Branch?: Partial<BranchVisitor>
}

export const visitM = (pure: <T>(t: T) => Monad<T>) => {
  const sequenceM = <T>(arrM: Monad<T>[]): Monad<T[]> =>
    arrM.reduce(
      (arrM, valM) =>
        arrM.flatMap((arr) => valM.flatMap((val) => pure([...arr, val]))),
      pure([] as T[])
    )

  // Commands
  const visitCmd = (transformer: Transformer): CmdVisitor => ({
    'Cmd.Exec': ({ fn, args }) => pure(Cmd.Exec({ fn, args })),
    'Cmd.Run': ({ expr }) => transformer.Expr(expr).map(Cmd.Run),
    'Cmd.Def': ({ variable, value }) =>
      transformer.Expr(value).map((value) =>
        Cmd.Def({
          variable,
          value,
        })
      ),
    'Cmd.Return': ({ expr }) => transformer.Expr(expr).map(Cmd.Return),
    'Cmd.Dialogue': ({ character, line }) =>
      pure(Cmd.Dialogue({ character, line })),
    'Cmd.ChooseOne': ({ branches }) =>
      sequenceM<ChoiceBranch>(branches.map(transformer.Branch)).map(
        Cmd.ChooseOne
      ),
    'Cmd.ChooseAll': ({ branches }) =>
      sequenceM<ChoiceBranch>(branches.map(transformer.Branch)).map(
        Cmd.ChooseAll
      ),
    'Cmd.ForkFirst': ({ branches }) =>
      sequenceM<ForkBranch>(branches.map(transformer.Branch)).map(
        Cmd.ForkFirst
      ),
    'Cmd.ForkAll': ({ branches }) =>
      sequenceM<ForkBranch>(branches.map(transformer.Branch)).map(Cmd.ForkAll),
  })

  // Expressions
  const visitExpr = (transformer: Transformer): ExprVisitor => ({
    'Expr.Import': ({ path }) => pure(Expr.Import(path)),
    'Expr.Eval': ({ fn, args }) =>
      sequenceM<Expr>(args.map(transformer.Expr)).map((args) =>
        Expr.Eval({ fn, args })
      ),
    'Expr.Var': ({ variable }) => pure(Expr.Var(variable)),
    'Expr.Lit': ({ value }) => pure(Expr.Lit(value)),
    'Expr.Template': ({ parts }) =>
      sequenceM<Expr>(parts.map(transformer.Expr)).map(Expr.Template),
    'Expr.Unary': ({ op, expr }) =>
      transformer.Expr(expr).map((expr) => Expr.Unary({ op, expr })),
    'Expr.Binary': ({ exprLeft, op, exprRight }) => {
      const exprLeftM = transformer.Expr(exprLeft)
      const exprRightM = transformer.Expr(exprRight)
      return exprLeftM.flatMap((exprLeft) =>
        exprRightM.map((exprRight) => Expr.Binary({ exprLeft, op, exprRight }))
      )
    },
    'Expr.Paren': ({ expr }) => transformer.Expr(expr).map(Expr.Paren),
    'Expr.Cond': ({ branches }) =>
      sequenceM<CondBranch>(branches.map(transformer.Branch)).map(Expr.Cond),
    'Expr.Cmd': ({ cmd }) => transformer.Cmd(cmd).map(Expr.Cmd),
    'Expr.Cmds': ({ cmds }) =>
      sequenceM<Cmd>(cmds.map(transformer.Cmd)).map(Expr.Cmds),
    'Expr.Result': ({ cmdExpr }) => transformer.Expr(cmdExpr).map(Expr.Result),
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
        resultM.flatMap((result) => pure(Branch.Cond({ condition, result })))
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
      Branch: ((branch: ChoiceBranch | ForkBranch | CondBranch) => {
        const branchM = match(branch, {
          ...visitBranch(transducer),
          ...(visitor.Branch || {}),
        })
        return (branchM as Monad<any>).map((branchResult) => ({
          ...(branch.loc ? { loc: branch.loc } : {}),
          ...branchResult,
        }))
      }) as unknown as BranchTransformer,
    }
    return transducer
  }

  return makeTransformer
}

export const transformM = (pure: <T>(t: T) => Monad<T>) => {
  const sequenceM = <T>(arrM: Monad<T>[]): Monad<T[]> =>
    arrM.reduce(
      (arrM, valM) =>
        arrM.flatMap((arr) => valM.flatMap((val) => pure([...arr, val]))),
      pure([] as T[])
    )

  // Program
  const runTransformM =
    (visitor: ASTVisitor) =>
    ({ commands }: Prog): Monad<Prog> => {
      const transformer = visitM(pure)(visitor)
      return sequenceM<Cmd>(commands.map(transformer.Cmd)).flatMap((commands) =>
        pure({ commands })
      )
    }

  return runTransformM
}
