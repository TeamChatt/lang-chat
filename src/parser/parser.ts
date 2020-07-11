import {
  alt,
  createLanguage,
  end,
  fail,
  newline,
  notFollowedBy,
  of,
  Parser,
  regexp,
  seq,
  seqObj,
  string,
} from 'parsimmon'
import {
  ChoiceBranch,
  Cmd,
  CmdChooseAll,
  CmdChooseOne,
  CmdDef,
  CmdDialogue,
  CmdExec,
  CmdForkAll,
  CmdForkFirst,
  CmdRun,
  CondBranch,
  Expr,
  ExprCmd,
  ExprCmds,
  ExprCond,
  ExprImport,
  ExprEval,
  ExprLit,
  ExprVar,
  ForkBranch,
  Prog,
  ExprParen,
} from '../static/ast'
import { indentLine, space, strLit } from './helpers'
import { withOperators } from './operator-parser'

const flatten = <T>(arr: T[][]): T[] =>
  arr.length === 0 ? [] : [...arr[0], ...flatten(arr.slice(1))]

const reservedWords = [
  'branch',
  'case',
  'choice',
  'choose-all',
  'choose',
  'cond',
  'do',
  'exec',
  'eval',
  'false',
  'fork-all',
  'fork-first',
  'import',
  'let',
  'true',
]

// Reserved words
const tCase = string('case')
const tChoice = string('choice')
const tChoose = string('choose')
const tChooseAll = string('choose-all')
const tCond = string('cond')
const tDo = string('do')
const tExec = string('exec')
const tEval = string('eval')
const tFalse = string('false')
const tForkAll = string('fork-all')
const tForkBranch = string('branch')
const tForkFirst = string('fork-first')
const tImport = string('import')
const tLet = string('let')
const tRun = string('run')
const tTrue = string('true')
// Symbol Tokens
const tAt = string('@')
const tArrow = string('->')
const tCaret = string('>')
const tCloseParen = string(')')
const tComma = string(',')
const tEquals = string('=')
const tOpenParen = string('(')
// Variables and strings
const tCharacterName = tAt.then(regexp(/.+/)).desc('a character name')
const tVar = regexp(/[a-zA-Z][a-zA-Z0-9_-]*/)
  .chain((name) =>
    reservedWords.includes(name)
      ? fail(`a variable, but found reserved word: ${name}`)
      : of(name)
  )
  .desc('a variable')
const tStr = strLit
const tNum = regexp(/[0-9]+/)
  .map(Number)
  .desc('a number')
const tBool = alt(tTrue.result(true), tFalse.result(false))

// Lines & Comments
const comment = seq(regexp(/[ ]*/), string('//'), regexp(/.*/), newline)
const commentOrBlank = alt(comment, newline)
const newlines = seq(newline, commentOrBlank.many())

type Language = {
  program: Parser<Prog>
  cmd: Parser<Cmd>
  cmds: Parser<Cmd[]>
  expr: Parser<Expr>
  choiceBranch: Parser<any>
  forkBranch: Parser<any>
  condBranch: Parser<any>
  dialogueLine: Parser<string>
  literal: Parser<string | number | boolean>
}

//Language
const language = (indent: number) =>
  createLanguage({
    program(lang: Language): Parser<Prog> {
      return seqObj<Prog>(['commands', lang.cmds]).trim(newline.many())
    },

    cmd(lang: Language): Parser<Cmd> {
      const cmdExec = seqObj<CmdExec>(
        ['kind', of('Cmd.Exec')],
        tExec,
        tOpenParen,
        ['fn', tStr],
        ['args', tComma.then(space).then(lang.expr).many()],
        tCloseParen
      )
      const cmdDialogue = seqObj<CmdDialogue>(
        ['kind', of('Cmd.Dialogue')],
        ['character', tCharacterName],
        newline,
        ['line', language(indent + 2).dialogueLine.thru(indentLine(indent + 2))]
      )
      const cmdRun = seqObj<CmdRun>(
        ['kind', of('Cmd.Run')],
        tRun,
        space,
        ['expr', lang.expr] // prettier-ignore
      )
      const cmdDef = seqObj<CmdDef>(
        ['kind', of('Cmd.Def')],
        tLet,
        space,
        ['variable', tVar],
        space,
        tEquals,
        space,
        ['value', lang.expr]
      )
      const cmdChooseOne = seqObj<CmdChooseOne>(
        ['kind', of('Cmd.ChooseOne')],
        tChoose,
        newlines,
        [
          'branches',
          language(indent + 2)
            .choiceBranch.thru(indentLine(indent + 2))
            .sepBy1(newlines),
        ]
      )
      const cmdChooseAll = seqObj<CmdChooseAll>(
        ['kind', of('Cmd.ChooseAll')],
        tChooseAll,
        newlines,
        [
          'branches',
          language(indent + 2)
            .choiceBranch.thru(indentLine(indent + 2))
            .sepBy1(newlines),
        ]
      )
      const cmdForkFirst = seqObj<CmdForkFirst>(
        ['kind', of('Cmd.ForkFirst')],
        tForkFirst,
        newlines,
        [
          'branches',
          language(indent + 2)
            .forkBranch.thru(indentLine(indent + 2))
            .sepBy1(newlines),
        ]
      )
      const cmdForkAll = seqObj<CmdForkAll>(
        ['kind', of('Cmd.ForkAll')],
        tForkAll,
        newlines,
        [
          'branches',
          language(indent + 2)
            .forkBranch.thru(indentLine(indent + 2))
            .sepBy1(newlines),
        ]
      )

      return alt<Cmd>(
        cmdExec,
        cmdRun,
        cmdDef,
        cmdDialogue,
        cmdChooseOne,
        cmdChooseAll,
        cmdForkFirst,
        cmdForkAll
      )
    },

    cmds(lang: Language): Parser<Cmd[]> {
      const cmdsDialogue = tCharacterName
        .thru(indentLine(indent))
        .skip(newline)
        .chain((character) =>
          seqObj<CmdDialogue>(
            ['kind', of('Cmd.Dialogue')],
            ['character', of(character)],
            ['line', language(indent + 2).dialogueLine]
          )
            .thru(indentLine(indent + 2))
            .sepBy1(newlines)
        )
      const cmdsSingleton = lang.cmd
        .thru(indentLine(indent))
        .map((cmd) => [cmd])

      return alt(cmdsDialogue, cmdsSingleton).sepBy(newlines).map(flatten)
    },

    expr(lang: Language): Parser<Expr> {
      const exprVar = seqObj<ExprVar>(
        ['kind', of('Expr.Var')],
        ['variable', tVar]
      )
      const exprLit = seqObj<ExprLit>(
        ['kind', of('Expr.Lit')],
        ['value', lang.literal] // prettier-ignore
      )
      const exprParen = seqObj<ExprParen>(
        ['kind', of('Expr.Paren')],
        tOpenParen,
        ['expr', lang.expr],
        tCloseParen
      )
      const exprOperators = withOperators(alt(exprVar, exprLit, exprParen))
      const exprImport = seqObj<ExprImport>(
        ['kind', of('Expr.Import')],
        tImport,
        tOpenParen,
        ['path', tStr],
        tCloseParen
      )
      const exprEval = seqObj<ExprEval>(
        ['kind', of('Expr.Eval')],
        tEval,
        tOpenParen,
        ['fn', tStr],
        ['args', tComma.then(space).then(lang.expr).many()],
        tCloseParen
      )
      const exprCond = seqObj<ExprCond>(
        ['kind', of('Expr.Cond')],
        tCond,
        newlines,
        [
          'branches',
          language(indent + 2)
            .condBranch.thru(indentLine(indent + 2))
            .sepBy1(newlines),
        ]
      )
      const exprCmd = seqObj<ExprCmd>(
        ['kind', of('Expr.Cmd')],
        ['cmd', lang.cmd]
      )
      const exprCmds = seqObj<ExprCmds>(
        ['kind', of('Expr.Cmds')],
        tDo,
        newlines,
        ['cmds', language(indent + 2).cmds]
      )

      return alt<Expr>(
        exprOperators,
        exprImport,
        exprEval,
        exprVar,
        exprLit,
        exprParen,
        exprCond,
        exprCmd,
        exprCmds
      )
    },

    //Branches
    choiceBranch(lang): Parser<ChoiceBranch> {
      return seqObj<ChoiceBranch>(
        ['kind', of('Branch.Choice')],
        tChoice,
        space,
        ['label', tStr],
        space,
        ['cmdExpr', lang.expr]
      )
    },
    forkBranch(lang): Parser<ForkBranch> {
      return seqObj<ForkBranch>(
        ['kind', of('Branch.Fork')],
        tForkBranch,
        space,
        ['cmdExpr', lang.expr] // prettier-ignore
      )
    },
    condBranch(lang): Parser<CondBranch> {
      return seqObj<CondBranch>(
        ['kind', of('Branch.Cond')],
        tCase,
        space,
        ['condition', lang.expr],
        space,
        tArrow,
        space,
        ['result', lang.expr]
      )
    },

    // Dialogue
    dialogueLine(lang): Parser<string> {
      const restOfLine = regexp(/.*/)
      const singleLine = tCaret.then(space).then(restOfLine)
      const multiLine = seq(
        singleLine.skip(newline),
        notFollowedBy(tCaret)
          .then(restOfLine)
          .thru(indentLine(indent))
          .sepBy1(newline)
      )
        .map(([first, next]) => [first, ...next])
        .tieWith('\n')

      return alt(multiLine, singleLine)
    },

    // Literals
    literal(lang): Parser<string | number | boolean> {
      return alt(tStr, tNum, tBool)
    },
  })

export const programParser = language(0).program.skip(end) as Parser<Prog>
