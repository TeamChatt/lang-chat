import { match } from '../util/match'
import { Prog, Cmd, Expr } from './ast'
import { Type, literalType, unifyTypes, isCmd, printType } from './types'
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

const CmdAny = Type.Cmd(Type.Any)
const CmdUnit = Type.Cmd(Type.Unit)

//-----------------------------------------------------------------------------
// Type Synthesis
//-----------------------------------------------------------------------------
const synthUnify = (typesM: TypeChecker<Type>[]): TypeChecker<Type> =>
  sequenceM(typesM).flatMap((types) =>
    unifyTypes(types).maybe(
      (t) => pure(t),
      () =>
        fail(`Couldn't unify types: ${JSON.stringify(types.map(printType))}`)
    )
  )

const synthCmd = (cmd: Cmd): TypeChecker<Type> =>
  match(cmd, {
    'Cmd.Exec': ({ args }) =>
      // Assert that args aren't Cmd type
      sequenceM<Type>(args.map(synthExpr))
        .flatMap((argTypes) =>
          sequenceM(
            argTypes.map((t) =>
              !isCmd(t) ? pure(null) : fail("Can't call exec with command type")
            )
          )
        )
        .map(() => CmdAny),
    'Cmd.Run': ({ expr }) => checkExpr(CmdAny)(expr),
    'Cmd.Def': ({ variable, value }) =>
      synthExpr(value)
        .flatMap((t) => defineVar(variable, t))
        .map(() => CmdAny),
    'Cmd.Return': ({ expr }) => synthExpr(expr).map(Type.Cmd),
    'Cmd.Dialogue': () => pure(CmdAny),
    'Cmd.ChooseOne': ({ branches }) =>
      checkBranches(CmdAny)(branches).map(() => CmdAny),
    'Cmd.ChooseAll': ({ branches }) =>
      checkBranches(CmdAny)(branches).map(() => CmdAny),
    'Cmd.ForkFirst': ({ branches }) =>
      checkBranches(CmdAny)(branches).map(() => CmdAny),
    'Cmd.ForkAll': ({ branches }) =>
      checkBranches(CmdAny)(branches).map(() => CmdAny),
  })

const synthExpr = (expr: Expr): TypeChecker<Type> =>
  match(expr, {
    'Expr.Import': ({ path }) =>
      path.endsWith('.chat') ? pure(CmdUnit) : pure(Type.String),
    'Expr.Eval': ({ args }) =>
      // Assert that args aren't Cmd type
      sequenceM<Type>(args.map(synthExpr))
        .flatMap((argTypes) =>
          sequenceM(
            argTypes.map((t) =>
              !isCmd(t)
                ? pure(CmdAny)
                : fail("Can't call eval with command type")
            )
          )
        )
        .map(() => Type.Any),
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(literalType(value)),
    'Expr.Template': ({ parts }) =>
      sequenceM(parts.map(checkExpr(Type.String))).map(() => Type.String),
    'Expr.Unary': ({ expr, op }) => {
      switch (op) {
        case '-':
          return checkExpr(Type.Number)(expr).map(() => Type.Number)
        case '!':
          return checkExpr(Type.Bool)(expr).map(() => Type.Bool)
        default:
          return fail<Type>(`Unknown operator ${op}`)
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
        default:
          return fail<Type>(`Unknown operator ${op}`)
      }
    },
    'Expr.Paren': ({ expr }) => synthExpr(expr),
    'Expr.Cond': ({ branches }) => synthBranches(branches),
    'Expr.Cmd': ({ cmd }) => checkCmd(CmdAny)(cmd),
    'Expr.Cmds': ({ cmds }) =>
      scoped(sequenceM(cmds.map(checkCmd(CmdAny)))).map(
        (types) => types[types.length - 1] || CmdAny
      ),
    'Expr.Result': ({ cmdExpr }) =>
      checkExpr(CmdAny)(cmdExpr).flatMap((t) =>
        isCmd(t)
          ? pure(t.resultType)
          : fail<Type>(`Can't get result from non command type`)
      ),
  })

const synthBranches = (branches: any[]): TypeChecker<Type> =>
  synthUnify(branches.map(synthBranch))

const synthBranch = (branch): TypeChecker<Type> =>
  match(branch, {
    'Branch.Choice': ({ cmdExpr }) =>
      checkExpr(CmdAny)(cmdExpr).map(() => CmdAny),
    'Branch.Fork': ({ cmdExpr }) =>
      checkExpr(CmdAny)(cmdExpr).map(() => CmdAny),
    'Branch.Cond': ({ condition, result }) =>
      pure(undefined)
        .flatMap(() => checkExpr(Type.Bool)(condition))
        .flatMap(() => synthExpr(result)),
  })

//-----------------------------------------------------------------------------
// Type Checking
//-----------------------------------------------------------------------------

const checkCmd =
  (type: Type) =>
  (cmd: Cmd): TypeChecker<Type> =>
    withLocation(cmd.loc!, synthCmd(cmd).flatMap(expectType(type)))

const checkExpr =
  (type: Type) =>
  (expr: Expr): TypeChecker<Type> =>
    synthExpr(expr).flatMap(expectType(type))

const checkBranches =
  (type: Type) =>
  (branches: any[]): TypeChecker<Type[]> =>
    sequenceM(branches.map(checkBranch(type)))

const checkBranch =
  (type: Type) =>
  (branch: any): TypeChecker<Type> =>
    synthBranch(branch).flatMap(expectType(type))

const checkProg = ({ commands }: Prog): TypeChecker<Prog> =>
  sequenceM(commands.map(checkCmd(CmdAny))).map(() => ({ commands }))

export const typeCheck = (prog: Prog): Prog =>
  checkProg(prog)
    .run(empty)
    .map(([ctx, prog]) => prog)
    .coerce()
