import match from '../util/match'
import { Maybe } from '../data/maybe'
import {
  indent,
  layout,
  concat,
  str,
  seq,
  intersperse,
  lines,
  newline,
  Doc,
} from '../data/doc'
import { Prog, Cmd, Expr } from './ast'

const partition = <T>(arr: T[], f: (t: T) => boolean): [T[], T[]] => {
  const index = arr.findIndex((x) => !f(x))
  return index === -1 ? [arr, []] : [arr.slice(0, index), arr.slice(index)]
}

const parens = (doc: Doc<string>) => seq(str('('), doc, str(')'))
const list = (docs: Doc<string>[]) => intersperse(docs, str(','))
const indentBlock = (doc: Doc<string>): Doc<string> =>
  indent(concat(newline as Doc<string>, doc))

// Dialogue
const printLine = (line: string): Doc<string> =>
  seq(str('>'), str(' '), str(line))

const printLines = (dialogueLines: string[]): Doc<string> =>
  lines(dialogueLines.map(printLine))

const getCharacter = (cmd: Cmd) =>
  match(cmd, {
    'Cmd.Dialogue': ({ character }) => Maybe.just(character),
    'Cmd.Exec': () => Maybe.nothing(),
    'Cmd.Run': () => Maybe.nothing(),
    'Cmd.Def': () => Maybe.nothing(),
    'Cmd.ChooseOne': () => Maybe.nothing(),
    'Cmd.ChooseAll': () => Maybe.nothing(),
    'Cmd.ForkFirst': () => Maybe.nothing(),
    'Cmd.ForkAll': () => Maybe.nothing(),
  })
const getLine = (cmd: Cmd) =>
  match(cmd, {
    'Cmd.Dialogue': ({ line }) => line,
  })
const matchesCharacter = (character: string) => (cmd: Cmd) =>
  getCharacter(cmd)
    .map((char) => char === character)
    .maybe(
      (t) => t,
      () => false
    )

// Commands
const printCmds = (cmds: Cmd[]): Doc<string> => {
  const coalesce = (cmds: Cmd[]): Doc<string>[] =>
    cmds.length === 0 ? [] : coalesceWith(cmds[0], cmds.slice(1))

  const coalesceWith = (cmd: Cmd, cmds: Cmd[]) =>
    getCharacter(cmd).maybe(
      (character) => {
        const [match, rest] = partition(
          [cmd, ...cmds],
          matchesCharacter(character)
        )
        const dialogue = seq(
          str(`@${character}`),
          indentBlock(printLines(match.map(getLine)))
        )
        return [dialogue, ...coalesce(rest)]
      },
      () => [printCmd(cmd), ...coalesce(cmds)]
    )

  return lines(coalesce(cmds))
}

const printCmd = (cmd: Cmd): Doc<string> =>
  match(cmd, {
    'Cmd.Exec': ({ fn, args }) =>
      seq(str('exec'), parens(list([str(`"${fn}"`), ...args.map(printExpr)]))),
    'Cmd.Run': ({ expr }) => seq(str('run'), str(' '), printExpr(expr)),
    'Cmd.Def': ({ variable, value }) =>
      seq(
        str('let'),
        str(' '),
        str(variable),
        str(' '),
        str('='),
        str(' '),
        printExpr(value)
      ),
    'Cmd.Dialogue': ({ character, line }) =>
      seq(str(`@${character}`), indentBlock(printLine(line))),
    'Cmd.ChooseOne': ({ branches }) =>
      seq(str('choose-one'), indentBlock(printBranches(branches))),
    'Cmd.ChooseAll': ({ branches }) =>
      seq(str('choose-all'), indentBlock(printBranches(branches))),
    'Cmd.ForkFirst': ({ branches }) =>
      seq(str('fork-first'), indentBlock(printBranches(branches))),
    'Cmd.ForkAll': ({ branches }) =>
      seq(str('fork-all'), indentBlock(printBranches(branches))),
  })

// Expressions
const printExpr = (expr: Expr): Doc<string> =>
  match(expr, {
    'Expr.Import': ({ path }) =>
      seq(str('import'), str('('), str(`"${path}"`), str(')')),
    'Expr.Var': ({ variable }) => str(variable),
    'Expr.Lit': ({ value }) => str(`${value}`),
    'Expr.Unary': ({ op, expr }) => seq(str(op), printExpr(expr)),
    'Expr.Binary': ({ exprLeft, op, exprRight }) =>
      seq(
        printExpr(exprLeft),
        str(' '),
        str(op),
        str(' '),
        printExpr(exprRight)
      ),
    'Expr.Paren': ({ expr }) => seq(str('('), printExpr(expr), str(')')),
    'Expr.Cond': ({ branches }) =>
      seq(str('cond'), indentBlock(printBranches(branches))),
    'Expr.Cmd': ({ cmd }) => printCmd(cmd),
    'Expr.Cmds': ({ cmds }) => seq(str('do'), indentBlock(printCmds(cmds))),
  })

// Branch types
const printBranches = (branches): Doc<string> =>
  lines(branches.map(printBranch))

const printBranch = (branch): Doc<string> =>
  match(branch, {
    'Branch.Choice': ({ label, cmdExpr }) =>
      seq(
        str('choice'),
        str(' '),
        str(`"${label}"`),
        str(' '),
        printExpr(cmdExpr)
      ),
    'Branch.Fork': ({ cmdExpr }) =>
      seq(str('fork'), str(' '), printExpr(cmdExpr)),
    'Branch.Cond': ({ condition, result }) =>
      seq(
        str('case'),
        str(' '),
        printExpr(condition),
        str(' '),
        str('->'),
        str(' '),
        printExpr(result)
      ),
  })

// Program
const printProg = ({ commands }: Prog): Doc<string> => printCmds(commands)

export const print = (program: Prog): string => layout(printProg(program))
