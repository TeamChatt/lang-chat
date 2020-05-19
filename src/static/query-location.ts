import match from '../util/match'
import { Maybe } from '../monad/maybe'
import { Prog, Cmd, Expr } from './ast'
import { Loc, equals, top } from './location'

const alts = <T>(maybes: Maybe<T>[]): Maybe<T> =>
  maybes.reduce((m1, m2) => m1.alt(m2), Maybe.nothing())

const queryCmds = (query: Loc) => (cmds: Cmd[]): Maybe<Cmd[]> =>
  alts(
    cmds.map((cmd, i) => {
      const withRest = (matched) => [...matched, ...cmds.slice(i + 1)]
      const queryFirst = queryCmd(query)
      const queryFirstWithRest = (cmd) => queryFirst(cmd).map(withRest)
      return match(cmd, {
        'Cmd.ForkFirst': ({ loc }) =>
          equals(query)(loc) ? queryFirstWithRest(cmd) : queryFirst(cmd),
        'Cmd.ForkAll': ({ loc }) =>
          equals(query)(loc) ? queryFirstWithRest(cmd) : queryFirst(cmd),
        'Cmd.Def': ({ loc }) =>
          equals(query)(loc) ? queryFirstWithRest(cmd) : queryFirst(cmd),
        'Cmd.Exec': queryFirstWithRest,
        'Cmd.Run': queryFirstWithRest,
        'Cmd.ChooseOne': queryFirstWithRest,
        'Cmd.ChooseAll': queryFirstWithRest,
      })
    })
  )

const queryCmd = (query: Loc) => (cmd: Cmd): Maybe<Cmd[]> =>
  equals(query)(cmd.loc) ? Maybe.just([cmd]) : queryCmdInner(query)(cmd)

const queryCmdInner = (query: Loc) => (cmd: Cmd): Maybe<Cmd[]> =>
  match(cmd, {
    'Cmd.Exec': () => Maybe.nothing(),
    'Cmd.Run': ({ expr }) => queryExpr(query)(expr),
    'Cmd.Def': ({ value }) => queryExpr(query)(value),
    'Cmd.ChooseOne': ({ branches }) => queryBranches(query)(branches),
    'Cmd.ChooseAll': ({ branches }) => queryBranches(query)(branches),
    'Cmd.ForkFirst': ({ branches }) => queryBranches(query)(branches),
    'Cmd.ForkAll': ({ branches }) => queryBranches(query)(branches),
  })

const queryExpr = (query: Loc) => (expr: Expr): Maybe<Cmd[]> =>
  match(expr, {
    'Expr.Var': () => Maybe.nothing(),
    'Expr.Lit': () => Maybe.nothing(),
    'Expr.Cond': ({ branches }) => queryBranches(query)(branches),
    'Expr.Cmd': ({ cmd }) => queryCmd(query)(cmd),
    'Expr.Cmds': ({ cmds }) => queryCmds(query)(cmds),
  })

const queryBranches = (query: Loc) => (branches) =>
  alts(branches.map(queryBranch(query)))

const queryBranch = (query: Loc) => (branch): Maybe<Cmd[]> =>
  match(branch, {
    'Branch.Choice': () => Maybe.nothing(),
    'Branch.Fork': ({ loc, cmdExpr }) =>
      equals(query)(loc)
        ? Maybe.just([Cmd.Run(cmdExpr)])
        : queryExpr(query)(cmdExpr),
    'Branch.Cond': ({ condition, result }) =>
      // TODO: no need to query condition unless we start allowing command expressions as conditional
      alts([queryExpr(query)(condition), queryExpr(query)(result)]),
  })

const queryProg = (loc: Loc) => ({ commands }: Prog): Maybe<Cmd[]> =>
  equals(loc)(top)
    ? Maybe.just(commands)
    : queryCmds(loc)(commands).map((cmds) => cmds.slice(1))

export default queryProg