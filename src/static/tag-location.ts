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
      'Cmd.Exec': ({ fn, args }) =>
        withLocation(
          withArray('args', args.map(transducer.Expr)).map((args) =>
            Cmd.Exec({ fn, args })
          )
        ),
      'Cmd.Run': ({ expr }) =>
        withLocation(withKey('expr', transducer.Expr(expr)).map(Cmd.Run)),
      'Cmd.Return': ({ expr }) =>
        withLocation(withKey('expr', transducer.Expr(expr)).map(Cmd.Return)),
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
        withLocation(
          withKey('line', transducer.Expr(line)).map((line) =>
            Cmd.Dialogue({ character, line })
          )
        ),
      'Cmd.ChooseOne': ({ branches }) =>
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            Cmd.ChooseOne
          )
        ),
      'Cmd.ChooseAll': ({ branches }) =>
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            Cmd.ChooseAll
          )
        ),
      'Cmd.ForkFirst': ({ branches }) =>
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            Cmd.ForkFirst
          )
        ),
      'Cmd.ForkAll': ({ branches }) =>
        withLocation(
          withArray('branches', branches.map(transducer.Branch)).map(
            Cmd.ForkAll
          )
        ),
    },
    Branch: {
      'Branch.Fork': ({ cmdExpr }) =>
        withLocation(
          withKey('cmdExpr', transducer.Expr(cmdExpr)).map(Branch.Fork)
        ),
    },
  })

  return transduce(transducer)(program).run(empty)[1]
}
