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
  typeMismatch,
} from './type-checker'
import { empty } from './type-context'

//-----------------------------------------------------------------------------
// Type Synthesis
//-----------------------------------------------------------------------------

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
    'Expr.Import': () =>
      fail("Can't infer type from import statement. Did you forget to link?"),
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(literalType(value)),
    'Expr.Cond': ({ branches }) => synthBranches(branches),
    'Expr.Cmd': ({ cmd }) => checkCmd(Type.Cmd)(cmd).map(() => Type.Cmd),
    'Expr.Cmds': ({ cmds }) =>
      scoped(sequenceM(cmds.map(checkCmd(Type.Cmd)))).map(() => Type.Cmd),
  })

const synthBranches = (branches: any[]): TypeChecker<Type> =>
  sequenceM(branches.map(synthBranch)).flatMap((types) =>
    unifyTypes(types).maybe(
      (t) => pure(t),
      () => fail(`Couldn't unify types: ${JSON.stringify(types, null, 2)}`)
    )
  )

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

const checkCmd = (type: Type) => (cmd: Cmd): TypeChecker<Cmd> =>
  synthCmd(cmd).flatMap((t) => (t === type ? pure(cmd) : typeMismatch(type, t)))

const checkExpr = (type: Type) => (expr: Expr): TypeChecker<Expr> =>
  synthExpr(expr).flatMap((t) =>
    t === type ? pure(expr) : typeMismatch(type, t)
  )

const checkBranches = (type: Type) => (branches: any[]): TypeChecker<any[]> =>
  sequenceM(branches.map(checkBranch(type)))

const checkBranch = (type: Type) => (branch: any): TypeChecker<any> =>
  synthBranch(branch).flatMap((t) =>
    t === type ? pure(branch) : typeMismatch(type, t)
  )

const checkProg = ({ commands }: Prog): TypeChecker<Prog> =>
  sequenceM(commands.map(checkCmd(Type.Cmd))).map((commands) => ({ commands }))

export const typeCheck = (prog: Prog): Prog =>
  checkProg(prog)
    .run(empty)
    .map(([ctx, prog]) => prog)
    .coerce()
