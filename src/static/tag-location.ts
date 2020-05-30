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

export const tagLocation = (program) => {
  const transducer = makeTransducer({
    Cmd: {
      //@ts-ignore
      'Cmd.Exec': ({ fn, args }) =>
        withLocation(
          withArray('args', args.map(transducer.Expr)).map((args) =>
            Cmd.Exec({ fn, args })
          )
        ),
      'Cmd.Run': ({ expr }) =>
        withLocation(
          withKey('expr', transducer.Expr(expr)).map((expr) => Cmd.Run(expr))
        ),
      'Cmd.Def': ({ variable, value }) =>
        withLocation(
          withKey('value', transducer.Expr(value)).map((value) =>
            Cmd.Def({
              variable,
              value,
            })
          )
        ),
      'Cmd.Dialogue': ({ character, line }) =>
        withLocation(pure(Cmd.Dialogue({ character, line }))),
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
