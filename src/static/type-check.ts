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
    'Cmd.ChooseOne': ({ branches }) => synthBranches(branches),
    'Cmd.ChooseAll': ({ branches }) => synthBranches(branches),
    'Cmd.ForkFirst': ({ branches }) => synthBranches(branches),
    'Cmd.ForkAll': ({ branches }) => synthBranches(branches),
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
  sequenceM(branches.map(synthBranch))
    .map(unifyTypes)
    .flatMap((maybeT) =>
      maybeT.maybe(
        (t) => pure(t),
        () => fail("Couldn't unify types")
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
        .flatMap(() => checkExpr(Type.String)(condition))
        .flatMap(() => synthExpr(result)),
  })

//-----------------------------------------------------------------------------
// Type Checking
//-----------------------------------------------------------------------------

const checkCmd = (type: Type) => (cmd: Cmd): TypeChecker<undefined> =>
  synthCmd(cmd).flatMap((t) =>
    t === type ? pure(undefined) : fail("Types don't match")
  )

const checkExpr = (type: Type) => (expr: Expr): TypeChecker<undefined> =>
  synthExpr(expr).flatMap((t) =>
    t === type ? pure(undefined) : fail("Types don't match")
  )

const checkProg = ({ commands }: Prog): TypeChecker<undefined> =>
  sequenceM(commands.map(checkCmd(Type.Cmd))).map(() => undefined)

export const typeCheck = (prog) => checkProg(prog).run(empty)
