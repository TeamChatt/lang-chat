import match from '../util/match'
import { Prog, Cmd, Expr } from './ast'
import { Type, literalType, unifyTypes } from './types'
import {
  TypeChecker,
  scoped,
  sequenceM,
  lookupVar,
  defineVar,
  pure,
  fail,
  withLocation,
  expectType,
} from './type-checker'
import { empty } from './type-context'

//-----------------------------------------------------------------------------
// Type Synthesis
//-----------------------------------------------------------------------------
const synthUnify = (typesM: TypeChecker<Type>[]): TypeChecker<Type> =>
  sequenceM(typesM).flatMap((types) =>
    unifyTypes(types).maybe(
      (t) => pure(t),
      () => fail(`Couldn't unify types: ${JSON.stringify(types)}`)
    )
  )

const synthCmd = (cmd: Cmd): TypeChecker<Type> =>
  match<TypeChecker<any>>(cmd, {
    'Cmd.Exec': ({ args }) =>
      // Assert that args aren't Cmd type
      sequenceM<Type>(args.map(synthExpr)).flatMap((argTypes) =>
        sequenceM(
          argTypes.map((t) =>
            t !== Type.Cmd
              ? pure(null)
              : fail("Can't call exec with command type")
          )
        )
      ),
    'Cmd.Run': ({ expr }) => checkExpr(Type.Cmd)(expr),
    'Cmd.Def': ({ variable, value }) =>
      synthExpr(value).flatMap((t) => defineVar(variable, t)),
    'Cmd.Dialogue': () => pure(Type.Cmd),
    'Cmd.ChooseOne': ({ branches }) => checkBranches(Type.Cmd)(branches),
    'Cmd.ChooseAll': ({ branches }) => checkBranches(Type.Cmd)(branches),
    'Cmd.ForkFirst': ({ branches }) => checkBranches(Type.Cmd)(branches),
    'Cmd.ForkAll': ({ branches }) => checkBranches(Type.Cmd)(branches),
  }).flatMap(() => pure(Type.Cmd))

const synthExpr = (expr: Expr): TypeChecker<Type> =>
  match(expr, {
    'Expr.Import': ({ path }) =>
      path.endsWith('.chat') ? pure(Type.Cmd) : pure(Type.String),
    'Expr.Eval': ({ args }) =>
      // Assert that args aren't Cmd type
      sequenceM<Type>(args.map(synthExpr))
        .flatMap((argTypes) =>
          sequenceM(
            argTypes.map((t) =>
              t !== Type.Cmd
                ? pure(null)
                : fail("Can't call eval with command type")
            )
          )
        )
        .flatMap(() => pure(Type.Any)),
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(literalType(value)),
    'Expr.Unary': ({ expr, op }) => {
      switch (op) {
        case '-':
          return checkExpr(Type.Number)(expr).map(() => Type.Number)
        case '!':
          return checkExpr(Type.Bool)(expr).map(() => Type.Bool)
      }
    },
    'Expr.Binary': ({ exprLeft, op, exprRight }) => {
      const exprs = [exprLeft, exprRight]
      switch (op) {
        // Polymorphic equality
        case '==': // fall-through
        case '!=':
          return synthUnify(exprs.map(synthExpr)).map(() => Type.Bool)
        // Boolean
        case '&&': // fall-through
        case '||':
          return sequenceM(exprs.map(checkExpr(Type.Bool))).map(() => Type.Bool)
        // Numeric
        case '+': // fall-through
        case '-': // fall-through
        case '*': // fall-through
        case '/':
          return sequenceM(exprs.map(checkExpr(Type.Number))).map(
            () => Type.Number
          )
        // Comparison
        case '<': // fall-through
        case '<=': // fall-through
        case '>': // fall-through
        case '>=':
          return sequenceM(exprs.map(checkExpr(Type.Number))).map(
            () => Type.Bool
          )
      }
    },
    'Expr.Paren': ({ expr }) => synthExpr(expr),
    'Expr.Cond': ({ branches }) => synthBranches(branches),
    'Expr.Cmd': ({ cmd }) => checkCmd(Type.Cmd)(cmd).map(() => Type.Cmd),
    'Expr.Cmds': ({ cmds }) =>
      scoped(sequenceM(cmds.map(checkCmd(Type.Cmd)))).map(() => Type.Cmd),
  })

const synthBranches = (branches: any[]): TypeChecker<Type> =>
  synthUnify(branches.map(synthBranch))

const synthBranch = (branch): TypeChecker<Type> =>
  match(branch, {
    'Branch.Choice': ({ cmdExpr }) =>
      checkExpr(Type.Cmd)(cmdExpr).map(() => Type.Cmd),
    'Branch.Fork': ({ cmdExpr }) =>
      checkExpr(Type.Cmd)(cmdExpr).map(() => Type.Cmd),
    'Branch.Cond': ({ condition, result }) =>
      pure(undefined)
        .flatMap(() => checkExpr(Type.Bool)(condition))
        .flatMap(() => synthExpr(result)),
  })

//-----------------------------------------------------------------------------
// Type Checking
//-----------------------------------------------------------------------------

const checkCmd = (type: Type) => (cmd: Cmd): TypeChecker<Type> =>
  withLocation(cmd.loc, synthCmd(cmd).flatMap(expectType(type)))

const checkExpr = (type: Type) => (expr: Expr): TypeChecker<Type> =>
  synthExpr(expr).flatMap(expectType(type))

const checkBranches = (type: Type) => (branches: any[]): TypeChecker<Type[]> =>
  sequenceM(branches.map(checkBranch(type)))

const checkBranch = (type: Type) => (branch: any): TypeChecker<Type> =>
  synthBranch(branch).flatMap(expectType(type))

const checkProg = ({ commands }: Prog): TypeChecker<Prog> =>
  sequenceM(commands.map(checkCmd(Type.Cmd))).map(() => ({ commands }))

export const typeCheck = (prog: Prog): Prog =>
  checkProg(prog)
    .run(empty)
    .map(([ctx, prog]) => prog)
    .coerce()
