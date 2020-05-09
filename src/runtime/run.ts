import { Prog, Cmd, Expr } from '../ast'
import {
  Interpreter,
  pure,
  empty,
  defineVar,
  lookupVar,
  exec,
  forkFirst,
  forkLast,
  promptChoice,
  scoped,
} from './actions'
import { Maybe } from '../monad/maybe'

//TODO: how to write types for this
const match = (obj, cases) => cases[obj.kind](obj)

const sequenceM = <T>(
  array: T[],
  f: (x: T) => Interpreter<any>
): Interpreter<any> => array.map(f).reduce((p, q) => p.flatMap(() => q), empty)

// Runtime Error
class RuntimeError extends Error {}
const fail = () => {
  throw new RuntimeError()
}

// Result types
const Result = {
  Lit: (value: any) => ({ kind: 'Result.Lit', value }),
  Cmd: (cmd: Cmd) => ({ kind: 'Result.Cmd', cmd }),
  Cmds: (cmds: Cmd[]) => ({ kind: 'Result.Cmds', cmds }),
}
type Result = ResultLit | ResultCmd | ResultCmds

interface ResultLit {
  kind: 'Result.Lit'
  value: any
}
interface ResultCmd {
  kind: 'Result.Cmd'
  cmd: Cmd
}
interface ResultCmds {
  kind: 'Result.Cmds'
  cmds: Cmd[]
}

// Commands
const runCmd = (cmd: Cmd): Interpreter<any> =>
  match(cmd, {
    'Cmd.Exec': ({ fn, args }) => exec({ fn, args }),
    'Cmd.Run': ({ expr }) => evalExpr(expr).flatMap(runResult),
    'Cmd.Def': ({ variable, value }) =>
      evalExpr(value).flatMap((result) => defineVar(variable, result)),
    'Cmd.ChooseOne': ({ branches }) => runChooseOne(branches),
    'Cmd.ChooseAll': ({ branches }) => runChooseAll(branches),
    'Cmd.ForkFirst': ({ branches }) => forkFirst(branches.map(runBranch)),
    'Cmd.ForkLast': ({ branches }) => forkLast(branches.map(runBranch)),
  })

const runBranch = (branch): Interpreter<any> =>
  match(branch, {
    'Branch.Choice': ({ label, cmds }) => sequenceM(cmds, runCmd),
    'Branch.Fork': ({ cmds }) => sequenceM(cmds, runCmd),
    'Branch.Cond': fail,
  })

const runResult = (result: Result): Interpreter<any> =>
  scoped(
    match(result, {
      'Result.Cmd': ({ cmd }) => runCmd(cmd),
      'Result.Cmds': ({ cmds }) => sequenceM(cmds, runCmd),
      'Result.Lit': fail,
    })
  )

// Choices
type ChoiceBranch = { label: string; cmds: Cmd[] }

const toPrompt = ({ label }: ChoiceBranch, index: number) => ({
  index,
  label,
})
const fromPrompt = (choices: ChoiceBranch[]) => ({ index }) => choices[index]

const runChooseOne = (choices: ChoiceBranch[]): Interpreter<ChoiceBranch> =>
  promptChoice(choices.map(toPrompt))
    .map(fromPrompt(choices))
    .flatMap((choice) => runBranch(choice).map(() => choice))

const runChooseAll = (choices: ChoiceBranch[]): Interpreter<any> =>
  choices.length === 0
    ? empty
    : runChooseOne(choices)
        .map((choice) => choices.filter((c) => c.label !== choice.label))
        .flatMap(runChooseAll)

// Expressions
const evalExpr = (expr: Expr): Interpreter<Result> =>
  match(expr, {
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(Result.Lit(value)),
    'Expr.Cmd': ({ cmd }) => pure(Result.Cmd(cmd)),
    'Expr.Cmds': ({ cmds }) => pure(Result.Cmds(cmds)),
    'Expr.Cond': ({ branches }) => evalBranches(branches),
  })

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
const runProgram = ({ commands }: Prog): Interpreter<Result> =>
  sequenceM(commands, runCmd)

export default runProgram
