import { match } from '../util/match'
import {
  Prog,
  Cmd,
  Expr,
  ChoiceBranch,
  CondBranch,
  ForkBranch,
} from '../static/ast'
import { Loc } from '../static/location'
import { Maybe } from '../data/maybe'
import {
  Result,
  Interpreter,
  pure,
  empty,
  defineVar,
  lookupVar,
  exec,
  dialogue,
  forkFirst,
  forkAll,
  choice,
  scoped,
  step,
  filterChoices,
} from './interpreter'
import { fromBranch, toBranch } from './choice'

const sequenceM = <T>(arrM: Interpreter<T>[]): Interpreter<T[]> =>
  arrM.reduce(
    (p, q) => p.flatMap((pInner) => q.map((qInner) => [...pInner, qInner])),
    pure([] as T[])
  )

// Type Error
class TypeError extends Error {}
const fail = () => {
  throw new TypeError()
}

// Commands
const runCmd = (cmd: Cmd): Interpreter<Result> =>
  step(cmd.loc!).flatMap(() => runCmdInner(cmd))

const runCmdInner = (cmd: Cmd): Interpreter<Result> =>
  match(cmd, {
    'Cmd.Exec': ({ fn, args }) =>
      sequenceM(args.map(evalExpr))
        .flatMap((results) => exec({ fn, args: results.map(getResult) }))
        .map(Result.Lit),
    'Cmd.Run': ({ expr }) => evalExpr(expr).flatMap(runResult),
    'Cmd.Return': ({ expr }) => evalExpr(expr),
    'Cmd.Def': ({ variable, value }) =>
      evalExpr(value)
        .flatMap((result) => defineVar(variable, result))
        .map(() => Result.Unit),
    'Cmd.Dialogue': ({ character, line }) =>
      evalExpr(line)
        .map(getResult)
        .flatMap((line) => dialogue({ character, line }))
        .map(() => Result.Unit),
    'Cmd.ChooseOne': ({ branches }) => runChooseOne(branches),
    'Cmd.ChooseAll': ({ branches }) =>
      runChooseAll(branches).map(() => Result.Unit),
    'Cmd.ForkFirst': ({ branches }) =>
      forkFirst(
        branches.map((branch) => ({
          interpreter: runBranch(branch),
          loc: branchLoc(branch),
        }))
      ).map(() => Result.Unit),
    'Cmd.ForkAll': ({ branches }) =>
      forkAll(
        branches.map((branch) => ({
          interpreter: runBranch(branch),
          loc: branchLoc(branch),
        }))
      ).map(() => Result.Unit),
  })

const runBranch = (branch: ChoiceBranch | ForkBranch): Interpreter<Result> =>
  match(branch, {
    'Branch.Choice': ({ cmdExpr }) => evalExpr(cmdExpr).flatMap(runResult),
    'Branch.Fork': ({ cmdExpr }) => evalExpr(cmdExpr).flatMap(runResult),
  })

const branchLoc = (branch: ForkBranch): Loc => branch.loc!

const runResult = (result: Result): Interpreter<Result> =>
  scoped(
    match(result, {
      'Result.Cmd': ({ cmd }) => runCmd(cmd),
      'Result.Cmds': ({ cmds }) =>
        sequenceM(cmds.map(runCmd)).map(
          (results) => results[results.length - 1]
        ),
      'Result.Lit': fail,
      'Result.Unit': fail,
    })
  )

// Choices
const filteredChoices = (
  choiceBranches: ChoiceBranch[]
): Interpreter<ChoiceBranch[]> =>
  filterChoices(choiceBranches.map(fromBranch(choiceBranches))).map((choices) =>
    choices.map(toBranch(choiceBranches))
  )

const runChooseOne = (choiceBranches: ChoiceBranch[]): Interpreter<Result> =>
  filteredChoices(choiceBranches).flatMap(runChoices(choiceBranches))

const runChooseAll = (choiceBranches: ChoiceBranch[]): Interpreter<Result> =>
  filteredChoices(choiceBranches).flatMap((branches) =>
    branches.length === 0
      ? empty
      : runChoices(choiceBranches)(branches).flatMap(() =>
          runChooseAll(choiceBranches)
        )
  )

const runChoices =
  (originalChoices: ChoiceBranch[]) =>
  (choices: ChoiceBranch[]): Interpreter<Result> =>
    choice(choices.map(fromBranch(originalChoices)))
      .map(toBranch(originalChoices))
      .flatMap((choiceBranch) => runBranch(choiceBranch))

// Expressions
const evalExpr = (expr: Expr): Interpreter<Result> =>
  match(expr, {
    'Expr.Import': () => {
      throw new Error('')
    },
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(Result.Lit(value)),
    'Expr.Template': ({ parts }) =>
      sequenceM(parts.map(evalExpr)).map((parts) =>
        Result.Lit(parts.map(getResult).join(''))
      ),
    'Expr.Unary': ({ expr, op }) =>
      evalExpr(expr).map(getResult).map(evalUnaryOp(op)),
    'Expr.Binary': ({ exprLeft, op, exprRight }) =>
      evalExpr(exprLeft)
        .map(getResult)
        .flatMap((left) =>
          evalExpr(exprRight)
            .map(getResult)
            .map((right) => evalBinaryOp(op)(left, right))
        ),
    'Expr.Paren': ({ expr }) => evalExpr(expr),
    'Expr.Cmd': ({ cmd }) => pure(Result.Cmd(cmd)),
    'Expr.Cmds': ({ cmds }) => pure(Result.Cmds(cmds)),
    'Expr.Cond': ({ branches }) => evalBranches(branches),
    'Expr.Result': ({ cmdExpr }) => evalExpr(cmdExpr).flatMap(runResult),
  })
const evalUnaryOp =
  (op: string) =>
  (value: any): Result => {
    switch (op) {
      case '!': return Result.Lit(!value) // prettier-ignore
      case '-': return Result.Lit(-value) // prettier-ignore
      default:
        throw new Error(`Unrecognized operator ${op}`)
    }
  }
const evalBinaryOp =
  (op: string) =>
  (left: any, right: any): Result => {
    switch (op) {
      case '+':  return Result.Lit(left +  right) // prettier-ignore
      case '-':  return Result.Lit(left -  right) // prettier-ignore
      case '==': return Result.Lit(left == right) // prettier-ignore
      case '!=': return Result.Lit(left != right) // prettier-ignore
      case '&&': return Result.Lit(left && right) // prettier-ignore
      case '||': return Result.Lit(left || right) // prettier-ignore
      case '<':  return Result.Lit(left <  right) // prettier-ignore
      case '<=': return Result.Lit(left <= right) // prettier-ignore
      case '>':  return Result.Lit(left >  right) // prettier-ignore
      case '>=': return Result.Lit(left >= right) // prettier-ignore
      case '*':  return Result.Lit(left *  right) // prettier-ignore
      case '/':  return Result.Lit(left /  right) // prettier-ignore
      default:
        throw new Error(`Unrecognized operator ${op}`)
    }
  }

type BranchResult = Interpreter<Maybe<Expr>>
const evalBranches = (branches: CondBranch[]): Interpreter<Result> =>
  branches
    .reduce<BranchResult>(
      (acc, branch) =>
        acc.flatMap((r) =>
          r.maybe(
            (x) => pure(Maybe.just(x)),
            () => evalBranch(branch)
          )
        ),
      pure(Maybe.nothing())
    )
    .flatMap((maybeExpr) => maybeExpr.maybe(evalExpr, fail))

const evalBranch = (branch: CondBranch): BranchResult =>
  match(branch, {
    'Branch.Cond': ({ condition, result }) =>
      evalExpr(condition).map((c) =>
        getResult(c) ? Maybe.just(result) : Maybe.nothing<Expr>()
      ),
  })

const getResult = (result: Result) =>
  match(result, {
    'Result.Cmd': fail,
    'Result.Cmds': fail,
    'Result.Lit': ({ value }) => value,
    'Result.Unit': () => undefined,
  })

// Program
export const runCmds = (cmds: Cmd[]): Interpreter<Result> =>
  sequenceM(cmds.map(runCmd)).map((results) => results[results.length - 1])

export const runProg = ({ commands }: Prog): Interpreter<Result> =>
  runCmds(commands)
