import { empty } from './location'
import {
  readLocation,
  withArray,
  withKey,
  pure,
  ASTContext,
} from './ast-context'
import { transduce, makeTransducer } from './transduce'
import { Cmd, Branch } from './ast'

const withLocation = (astM): ASTContext<any> =>
  readLocation().flatMap((loc) =>
    astM.map((ast) => ({
      ...ast,
      loc,
    }))
  )

const tagLocation = (program) => {
  const transducer = makeTransducer({
    Cmd: {
      //@ts-ignore
      'Cmd.Exec': ({ fn, args }) => withLocation(pure(Cmd.Exec({ fn, args }))),
      'Cmd.Run': ({ expr }) =>
        withLocation(transducer.Expr(expr).map((expr) => Cmd.Run(expr))),
      'Cmd.Def': ({ variable, value }) =>
        withLocation(
          transducer.Expr(value).map((value) => Cmd.Def({ variable, value }))
        ),
      'Cmd.ChooseOne': ({ branches }) =>
        //@ts-ignore
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            (branches) =>
              //@ts-ignore
              Cmd.ChooseOne(branches)
          )
        ),
      'Cmd.ChooseAll': ({ branches }) =>
        //@ts-ignore
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            (branches) =>
              //@ts-ignore
              Cmd.ChooseAll(branches)
          )
        ),
      'Cmd.ForkFirst': ({ branches }) =>
        //@ts-ignore
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            (branches) =>
              //@ts-ignore
              Cmd.ForkFirst(branches)
          )
        ),
      'Cmd.ForkAll': ({ branches }) =>
        //@ts-ignore
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            (branches) =>
              //@ts-ignore
              Cmd.ForkAll(branches)
          )
        ),
    },
    Branch: {
      'Branch.Fork': ({ cmdExpr }) =>
        withLocation(
          withKey('cmdExpr', transducer.Expr(cmdExpr)).map((cmdExpr) =>
            Branch.Fork(cmdExpr)
          )
        ),
    },
  })

  return transduce(transducer)(program).run(empty)[1]
}

export default tagLocation
