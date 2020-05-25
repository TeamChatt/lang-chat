import {
  string,
  regexp,
  seq,
  seqObj,
  newline,
  createLanguage,
  alt,
  of,
  Parser,
  end,
  fail,
} from 'parsimmon'
import {
  Prog,
  Cmd,
  Expr,
  CmdDef,
  CmdChooseOne,
  CmdChooseAll,
  CmdForkFirst,
  CmdForkAll,
  ChoiceBranch,
  ForkBranch,
  CondBranch,
  CmdExec,
  CmdRun,
  ExprVar,
  ExprCond,
  ExprCmd,
  ExprCmds,
  ExprLit,
} from '../static/ast'
import { indentLine, space, strLit } from './helpers'

const reservedWords = []

// Tokens and reserved words
const tLet = string('let')
const tEquals = string('=')
const tChoose = string('choose')
const tChooseAll = string('choose-all')
const tChoice = string('choice')
const tForkFirst = string('fork-first')
const tForkAll = string('fork-all')
const tForkBranch = string('branch')
const tCond = string('cond')
const tCase = string('case')
const tArrow = string('->')
const tDo = string('do')
const tRun = string('run')
const tExec = string('exec')
const tOpenParen = string('(')
const tCloseParen = string(')')
const tComma = string(',')
const tVar = regexp(/[a-zA-Z][a-zA-Z0-9_-]*/)
  .chain((name) =>
    reservedWords.includes(name)
      ? fail(`a variable, but found reserved word: ${name}`)
      : of(name)
  )
  .desc('a variable')
const tStr = strLit

// Comments
const comment = seq(regexp(/[ ]*/), string('//'), regexp(/.*/), newline)

type Language = {
  program: Parser<Prog>
  cmd: Parser<Cmd>
  expr: Parser<Expr>
  choiceBranch: Parser<any>
  forkBranch: Parser<any>
  condBranch: Parser<any>
}

//Language
const language = (indent: number) =>
  createLanguage({
    program(lang: Language): Parser<Prog> {
      return seqObj(['commands', lang.cmd.sepBy(newline)])
    },

    cmd(lang: Language): Parser<Cmd> {
      const cmdExec = seqObj<CmdExec>(
        ['kind', of('Cmd.Exec')],
        tExec,
        tOpenParen,
        ['fn', of('function-name')], // TODO
        ['args', of([])], // TODO
        tCloseParen
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
        ['variable', tVar],
        space,
        tEquals,
        space,
        ['value', lang.expr]
      )
      const cmdChooseOne = seqObj<CmdChooseOne>(
        ['kind', of('Cmd.ChooseOne')],
        tChoose,
        newline,
        [
          'branches',
          language(indent + 2)
            .choiceBranch.thru(indentLine(indent))
            .sepBy(newline),
        ]
      )
      const cmdChooseAll = seqObj<CmdChooseAll>(
        ['kind', of('Cmd.ChooseAll')],
        tChooseAll,
        newline,
        [
          'branches',
          language(indent + 2)
            .choiceBranch.thru(indentLine(indent))
            .sepBy(newline),
        ]
      )
      const cmdForkFirst = seqObj<CmdForkFirst>(
        ['kind', of('Cmd.ForkFirst')],
        tForkFirst,
        newline,
        [
          'branches',
          language(indent + 2)
            .forkBranch.thru(indentLine(indent))
            .sepBy(newline),
        ]
      )
      const cmdForkAll = seqObj<CmdForkAll>(
        ['kind', of('Cmd.ForkAll')],
        tForkAll,
        newline,
        [
          'branches',
          language(indent + 2)
            .forkBranch.thru(indentLine(indent))
            .sepBy(newline),
        ]
      )

      return alt<Cmd>(
        cmdExec,
        cmdRun,
        cmdDef,
        cmdChooseOne,
        cmdChooseAll,
        cmdForkFirst,
        cmdForkAll
      )
    },

    expr(lang: Language): Parser<Expr> {
      const exprVar = seqObj<ExprVar>(
        ['kind', of('Expr.Var')],
        ['variable', tVar]
      )
      const exprLit = seqObj<ExprLit>(
        ['kind', of('Expr.Lit')],
        ['value', tStr] // prettier-ignore
      )
      const exprCond = seqObj<ExprCond>(
        ['kind', of('Expr.Cond')],
        tCond,
        newline,
        [
          'branches',
          language(indent + 2)
            .condBranch.thru(indentLine(indent))
            .sepBy(newline),
        ]
      )
      const exprCmd = seqObj<ExprCmd>(
        ['kind', of('Expr.Cmd')],
        ['cmd', lang.cmd]
      )
      const exprCmds = seqObj<ExprCmds>(
        ['kind', of('Expr.Cmds')],
        tDo,
        newline,
        [
          'cmds',
          language(indent + 2)
            .cmd.thru(indentLine(indent))
            .sepBy(newline),
        ]
      )

      return alt(exprVar, exprLit, exprCond, exprCmd, exprCmds)
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
        tArrow,
        ['result', lang.expr]
      )
    },
  })

export const programParser = language(0).program.skip(end) as Parser<Prog>
