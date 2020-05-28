import match from '../util/match'
import { Prog, Cmd, Expr, ChoiceBranch } from '../static/ast'
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
const runCmd = (cmd: Cmd): Interpreter<any> =>
  step(cmd.loc).flatMap(() => runCmdInner(cmd))

const runCmdInner = (cmd: Cmd): Interpreter<any> =>
  match(cmd, {
    'Cmd.Exec': ({ fn, args }) =>
      sequenceM(args.map(evalExpr)).flatMap((results) =>
        exec({ fn, args: results.map(getResult) })
      ),
    'Cmd.Run': ({ expr }) => evalExpr(expr).flatMap(runResult),
    'Cmd.Def': ({ variable, value }) =>
      evalExpr(value).flatMap((result) => defineVar(variable, result)),
    'Cmd.Dialogue': ({ character, line }) => dialogue({ character, line }),
    'Cmd.ChooseOne': ({ branches }) => runChooseOne(branches),
    'Cmd.ChooseAll': ({ branches }) => runChooseAll(branches),
    'Cmd.ForkFirst': ({ branches }) =>
      forkFirst(
        branches.map((branch) => ({
          interpreter: runBranch(branch),
          loc: branchLoc(branch),
        }))
      ),
    'Cmd.ForkAll': ({ branches }) =>
      forkAll(
        branches.map((branch) => ({
          interpreter: runBranch(branch),
          loc: branchLoc(branch),
        }))
      ),
  })

const runBranch = (branch): Interpreter<any> =>
  match(branch, {
    'Branch.Choice': ({ cmdExpr }) => evalExpr(cmdExpr).flatMap(runResult),
    'Branch.Fork': ({ cmdExpr }) => evalExpr(cmdExpr).flatMap(runResult),
    'Branch.Cond': fail,
  })

const branchLoc = (branch): Loc => branch.loc

const runResult = (result: Result): Interpreter<any> =>
  scoped(
    match(result, {
      'Result.Cmd': ({ cmd }) => runCmd(cmd),
      'Result.Cmds': ({ cmds }) => sequenceM(cmds.map(runCmd)),
      'Result.Lit': fail,
    })
  )

// Choices
const filteredChoices = (
  choiceBranches: ChoiceBranch[]
): Interpreter<ChoiceBranch[]> =>
  filterChoices(choiceBranches.map(fromBranch(choiceBranches))).map((choices) =>
    choices.map(toBranch(choiceBranches))
  )

const runChooseOne = (
  choiceBranches: ChoiceBranch[]
): Interpreter<ChoiceBranch> =>
  filteredChoices(choiceBranches).flatMap(runChoices(choiceBranches))

const runChooseAll = (choiceBranches: ChoiceBranch[]): Interpreter<any> =>
  filteredChoices(choiceBranches).flatMap((branches) =>
    branches.length === 0
      ? empty
      : runChoices(choiceBranches)(branches).flatMap(() =>
          runChooseAll(choiceBranches)
        )
  )

const runChoices = (originalChoices: ChoiceBranch[]) => (
  choices: ChoiceBranch[]
): Interpreter<ChoiceBranch> =>
  choice(choices.map(fromBranch(originalChoices)))
    .map(toBranch(originalChoices))
    .flatMap((choiceBranch) => runBranch(choiceBranch))

// Expressions
const evalExpr = (expr: Expr): Interpreter<Result> =>
  match(expr, {
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(Result.Lit(value)),
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
  })
const evalUnaryOp = (op: string) => (value: any): Result => {
  switch (op) {
    case '!': return Result.Lit(!value) // prettier-ignore
    case '-': return Result.Lit(-value) // prettier-ignore
  }
}
const evalBinaryOp = (op: string) => (left: any, right: any): Result => {
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
  }
}

type BranchResult = Interpreter<Maybe<Expr>>
const evalBranches = (branches: any[]): Interpreter<Result> =>
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

const evalBranch = (branch): BranchResult =>
  match(branch, {
    'Branch.Cond': ({ condition, result }) =>
      evalExpr(condition).map((c) =>
        getResult(c) ? Maybe.just(result) : Maybe.nothing()
      ),
  })

const getResult = (result: Result) =>
  match(result, {
    'Result.Cmd': fail,
    'Result.Cmds': fail,
    'Result.Lit': ({ value }) => value,
  })

// Program
export const runCmds = (cmds: Cmd[]): Interpreter<any> =>
  sequenceM(cmds.map(runCmd))

export const runProg = ({ commands }: Prog): Interpreter<any> =>
  runCmds(commands)
