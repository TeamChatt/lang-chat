import { top } from './location'
import { readLocation, withArray, withKey, pure } from './ast-context'
import { transduce, makeTransducer } from './transduce'
import { Cmd, Branch } from './ast'

const withLocation = (astM) =>
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
      //@ts-ignore
      'Cmd.ChooseOne': withLocation(({ branches }) =>
        withArray('branches', branches.map(transducer.Branch)).map((branches) =>
          //@ts-ignore
          Cmd.ChooseOne(branches)
        )
      ),
      //@ts-ignore
      'Cmd.ChooseAll': withLocation(({ branches }) =>
        withArray('branches', branches.map(transducer.Branch)).map((branches) =>
          //@ts-ignore
          Cmd.ChooseAll(branches)
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

  return transduce(transducer)(program).run(top)[1]
}

export default tagLocation
