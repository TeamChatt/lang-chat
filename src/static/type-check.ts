import match from '../util/match'
import { Prog, Cmd, Expr } from './ast'
import { Type, literalType, unifyTypes } from './types'
import {
  TypeChecker,
  scoped,
  sequenceM,
  lookupVar,
  defineVar,
} from './type-checker'

//-----------------------------------------------------------------------------
// Type Synthesis
//-----------------------------------------------------------------------------

const synthCmd = (cmd: Cmd): TypeChecker<Type> =>
  match<TypeChecker<any>>(cmd, {
    'Cmd.Exec': ({ args }) =>
      //Assert that args aren't command type
      sequenceM<Type>(args.map(synthExpr)).flatMap((argTypes) =>
        sequenceM(
          argTypes.map((t) =>
            t !== Type.Cmd
              ? TypeChecker.of(null)
              : TypeChecker.fail("Can't call exec with command type")
          )
        )
      ),
    'Cmd.Run': ({ expr }) => checkExpr(Type.Cmd)(expr),
    'Cmd.Def': ({ variable, value }) =>
      synthExpr(value).flatMap((t) => defineVar(variable, t)),
    'Cmd.Dialogue': () => TypeChecker.of(Type.Cmd),
    'Cmd.ChooseOne': ({ branches }) => synthBranches(branches),
    'Cmd.ChooseAll': ({ branches }) => synthBranches(branches),
    'Cmd.ForkFirst': ({ branches }) => synthBranches(branches),
    'Cmd.ForkAll': ({ branches }) => synthBranches(branches),
  }).flatMap(() => TypeChecker.of(Type.Cmd))

const synthExpr = (expr: Expr): TypeChecker<Type> =>
  match(expr, {
    'Expr.Import': () =>
      TypeChecker.fail(
        "Can't infer type from import statement. Did you forget to link?"
      ),
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => TypeChecker.of(literalType(value)),
    'Expr.Cond': ({ branches }) => synthBranches(branches),
    'Expr.Cmd': ({ cmd }) => checkCmd(Type.Cmd)(cmd).map(() => Type.Cmd),
    'Expr.Cmds': ({ cmds }) =>
      scoped(sequenceM(cmds.map(checkCmd(Type.Cmd)))).map(() => Type.Cmd),
  })

const synthBranches = (branches: any[]): TypeChecker<Type> =>
  sequenceM(branches.map(synthBranch))
    .map(unifyTypes)
    .flatMap((maybeT) =>
      maybeT.maybe(
        (t) => TypeChecker.of(t),
        () => TypeChecker.fail("Couldn't unify types")
      )
    )

const synthBranch = (branch): TypeChecker<Type> =>
  match(branch, {
    'Branch.Choice': ({ cmdExpr }) =>
      checkExpr(Type.Cmd)(cmdExpr).map(() => Type.Cmd),
    'Branch.Fork': ({ cmdExpr }) =>
      checkExpr(Type.Cmd)(cmdExpr).map(() => Type.Cmd),
    'Branch.Cond': ({ condition, result }) =>
      TypeChecker.of(undefined)
        .flatMap(() => checkExpr(Type.String)(condition))
        .flatMap(() => synthExpr(result)),
  })

//-----------------------------------------------------------------------------
// Type Checking
//-----------------------------------------------------------------------------

const checkCmd = (type: Type) => (cmd: Cmd): TypeChecker<undefined> =>
  synthCmd(cmd).flatMap((t) =>
    t === type
      ? TypeChecker.of(undefined)
      : TypeChecker.fail("Types don't match")
  )

const checkExpr = (type: Type) => (expr: Expr): TypeChecker<undefined> =>
  synthExpr(expr).flatMap((t) =>
    t === type
      ? TypeChecker.of(undefined)
      : TypeChecker.fail("Types don't match")
  )

const checkProg = ({ commands }: Prog): TypeChecker<undefined> =>
  sequenceM(commands.map(checkCmd(Type.Cmd))).map(() => undefined)

export const typeCheck = (prog) => checkProg(prog)
