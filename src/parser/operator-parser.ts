import { Parser, seq, seqObj, alt, lazy, string, of } from 'parsimmon'
import { space } from './helpers'
import { Expr, ExprUnary } from '../static/ast'

// Operator Tokens
const tNot = string('!')
const tPlus = string('+')
const tMinus = string('-')
const tIsEqual = string('==')
const tNotEqual = string('!=')
const tAnd = string('&&')
const tOr = string('||')
const tLessThan = string('<')
const tLessThanEqual = string('<=')
const tGreaterThan = string('>')
const tGreaterThanEqual = string('>=')
const tTimes = string('*')
const tDivide = string('/')

// Takes a parser for the prefix operator, and a parser for the base thing being
// parsed, and parses as many occurrences as possible of the prefix operator.
const PREFIX = (operatorsParser, nextParser: Parser<Expr>): Parser<Expr> => {
  let parser = lazy(() => {
    const exprUnary = seqObj<ExprUnary>(
      ['kind', of('Expr.Unary')],
      ['op', operatorsParser],
      ['expr', nextParser]
    )
    return alt(exprUnary, nextParser)
  })
  return parser
}

// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// left. (e.g. 1-2-3 is (1-2)-3 not 1-(2-3))
const BINARY_LEFT = (
  operatorsParser: Parser<string>,
  nextParser: Parser<Expr>
): Parser<Expr> =>
  // We can't recurse in the direction we want, so we have to resort to parsing an
  // entire list of operator chunks and then using `.reduce` to manually nest
  // them again.
  //
  // Example:
  //
  // INPUT  :: "1+2+3"
  // PARSE  :: [1, ["+", 2], ["+", 3]]
  // REDUCE :: ["+", ["+", 1, 2], 3]
  seq<Expr, [string, Expr][]>(
    nextParser,
    seq<string, Expr>(operatorsParser.trim(space), nextParser).many()
  ).map(([first, rest]) =>
    rest.reduce(
      (acc, [op, another]) => ({
        kind: 'Expr.Binary',
        op,
        exprLeft: acc,
        exprRight: another,
      }),
      first
    )
  )

// Now we describe the operators in order by precedence.
const precedenceTable = [
  { type: PREFIX, ops: tMinus },
  { type: PREFIX, ops: tNot },
  { type: BINARY_LEFT, ops: alt(tTimes, tDivide) },
  { type: BINARY_LEFT, ops: alt(tPlus, tMinus) },
  {
    type: BINARY_LEFT,
    ops: alt(tLessThanEqual, tGreaterThanEqual, tLessThan, tGreaterThan),
  },
  { type: BINARY_LEFT, ops: alt(tIsEqual, tNotEqual) },
  { type: BINARY_LEFT, ops: tAnd },
  { type: BINARY_LEFT, ops: tOr },
]

export const withOperators = (baseExpr: Parser<Expr>): Parser<Expr> =>
  precedenceTable.reduce((acc, { type, ops }) => type(ops, acc), baseExpr)
