import { Expr, ExprLit } from '../static/ast'

const isLit = (e: Expr): e is ExprLit => e.kind === 'Expr.Lit'

// Smart constructor
export const dialogueExpr = (parts: Expr[]): Expr => {
  const seed: [ExprLit, Expr[]] = [Expr.Lit('') as ExprLit, []]
  const [acc, arr] = parts.reduce(scanDialogue, seed)
  return makeDialogue([...arr, acc])
}

const makeDialogue = (exprs: Expr[]) => {
  if (exprs.length === 0) {
    return Expr.Lit('')
  }
  if (exprs.length === 1) {
    return exprs[0]
  }
  return Expr.Template(exprs)
}

const scanDialogue = (
  [acc, arr]: [ExprLit, Expr[]],
  e: Expr
): [ExprLit, Expr[]] => {
  if (isLit(e)) {
    const newAcc = Expr.Lit(`${acc.value}${e.value}`) as ExprLit
    return [newAcc, arr]
  } else {
    const newAcc = Expr.Lit('') as ExprLit
    const newArr = [...arr, acc, e]
    return [newAcc, newArr]
  }
}
