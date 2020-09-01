import match from '../util/match'
import { Maybe } from '../data/maybe'
import { Prog, Cmd, Expr } from './ast'
import { Loc, equals, top } from './location'

const alts = <T>(maybes: Maybe<T>[]): Maybe<T> =>
  maybes.reduce((m1, m2) => m1.alt(m2), Maybe.nothing())

const queryCmds = (query: Loc) => (cmds: Cmd[]): Maybe<Cmd[]> =>
  // TODO: could make this lazier
  alts(
    cmds.map((cmd, i) =>
      equals(query)(cmd.loc)
        ? Maybe.just([cmd, ...cmds.slice(i + 1)])
        : queryCmd(query)(cmd)
    )
  )

const queryCmd = (query: Loc) => (cmd: Cmd): Maybe<Cmd[]> =>
  equals(query)(cmd.loc) ? Maybe.just([cmd]) : queryCmdInner(query)(cmd)

const queryCmdInner = (query: Loc) => (cmd: Cmd): Maybe<Cmd[]> =>
  match(cmd, {
    'Cmd.Exec': () => Maybe.nothing<Cmd[]>(),
    'Cmd.Run': ({ expr }) => queryExpr(query)(expr),
    'Cmd.Def': ({ value }) => queryExpr(query)(value),
    'Cmd.Dialogue': () => Maybe.nothing<Cmd[]>(),
    'Cmd.ChooseOne': ({ branches }) => queryBranches(query)(branches),
    'Cmd.ChooseAll': ({ branches }) => queryBranches(query)(branches),
    'Cmd.ForkFirst': ({ branches }) => queryBranches(query)(branches),
    'Cmd.ForkAll': ({ branches }) => queryBranches(query)(branches),
  })

const queryExpr = (query: Loc) => (expr: Expr): Maybe<Cmd[]> =>
  match(expr, {
    'Expr.Import': () => Maybe.nothing(),
    'Expr.Eval': () => Maybe.nothing(),
    'Expr.Var': () => Maybe.nothing(),
    'Expr.Lit': () => Maybe.nothing(),
    'Expr.Template': () => Maybe.nothing(),
    'Expr.Cond': ({ branches }) => queryBranches(query)(branches),
    'Expr.Cmd': ({ cmd }) => queryCmd(query)(cmd),
    'Expr.Cmds': ({ cmds }) => queryCmds(query)(cmds),
  })

const queryBranches = (query: Loc) => (branches): Maybe<Cmd[]> =>
  alts(branches.map(queryBranch(query)))

const queryBranch = (query: Loc) => (branch): Maybe<Cmd[]> =>
  match(branch, {
    'Branch.Choice': ({ cmdExpr }) => queryExpr(query)(cmdExpr),
    'Branch.Fork': ({ loc, cmdExpr }) =>
      equals(query)(loc)
        ? Maybe.just([Cmd.Run(cmdExpr)])
        : queryExpr(query)(cmdExpr),
    'Branch.Cond': ({ condition, result }) =>
      // TODO: no need to query condition unless we start allowing command expressions as conditional
      alts([queryExpr(query)(condition), queryExpr(query)(result)]),
  })

const queryProg = (loc: Loc) => ({ commands }: Prog): Maybe<Cmd[]> =>
  equals(loc)(top) ? Maybe.just(commands) : queryCmds(loc)(commands)

export default queryProg
