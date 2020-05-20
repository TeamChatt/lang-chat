import match from '../util/match'
import {
  indent,
  layout,
  concat,
  str,
  seq,
  intersperse,
  newline,
  Doc,
} from '../doc'
import { Prog, Cmd, Expr } from './ast'

const parens = (doc: Doc<string>) => seq([str('('), doc, str(')')])
const list = (docs: Doc<string>[]) => intersperse(docs, str(','))

// Commands
const printCmds = (cmds: Cmd[]) =>
  indent(concat(newline, intersperse(cmds.map(printCmd), newline)))

const printCmd = (cmd: Cmd): Doc<string> =>
  match(cmd, {
    'Cmd.Exec': ({ fn, args }) =>
      seq([str('exec'), parens(list([fn, ...args].map(str)))]),
    'Cmd.Run': ({ expr }) => seq([str('run'), str(' '), printExpr(expr)]),
    'Cmd.Def': ({ variable, value }) =>
      seq([
        str('let'),
        str(' '),
        str(variable),
        str(' '),
        str('='),
        str(' '),
        printExpr(value),
      ]),
    'Cmd.ChooseOne': ({ branches }) =>
      seq([str('choose-one'), printBranches(branches)]),
    'Cmd.ChooseAll': ({ branches }) =>
      seq([str('choose-all'), printBranches(branches)]),
    'Cmd.ForkFirst': ({ branches }) =>
      seq([str('fork-first'), printBranches(branches)]),
    'Cmd.ForkAll': ({ branches }) =>
      seq([str('fork-all'), printBranches(branches)]),
  })

// Expressions
const printExpr = (expr: Expr) =>
  match(expr, {
    'Expr.Var': ({ variable }) => str(variable),
    'Expr.Lit': ({ value }) => str(`${value}`),
    'Expr.Cond': ({ branches }) => printBranches(branches),
    'Expr.Cmd': ({ cmd }) => printCmd(cmd),
    'Expr.Cmds': ({ cmds }) => printCmds(cmds),
  })

// Branch types
const printBranches = (branches) =>
  indent(concat(newline, intersperse(branches.map(printBranch), newline)))

const printBranch = (branch) =>
  match(branch, {
    'Branch.Choice': ({ label, cmdExpr }) =>
      seq([
        str('choice'),
        str(' '),
        str(label),
        str(':'),
        str(' '),
        printExpr(cmdExpr),
      ]),
    'Branch.Fork': ({ cmdExpr }) =>
      seq([str('fork'), str(' '), printExpr(cmdExpr)]),
    'Branch.Cond': ({ condition, result }) =>
      seq([
        str('cond'),
        str(' '),
        printExpr(condition),
        str(' '),
        str('->'),
        str(' '),
        printExpr(result),
      ]),
  })

// Program
const printProg = ({ commands }: Prog): Doc<string> =>
  intersperse(commands.map(printCmd), newline as Doc<string>)

const printProgram = (program: Prog): string => layout(printProg(program))

export default printProgram
