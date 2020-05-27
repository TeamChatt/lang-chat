import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd, Expr, Branch } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'choice-1',
        cmdExpr: Expr.Cmds([
          Cmd.Exec({ fn: 'exec-choice-1', args: [] }),
          Cmd.Exec({ fn: 'exec-choice-1', args: [] }),
        ]),
      }),
      Branch.Choice({
        label: 'choice-2',
        cmdExpr: Expr.Cmds([
          Cmd.Exec({ fn: 'exec-choice-2', args: [] }),
          Cmd.Exec({ fn: 'exec-choice-2', args: [] }),
        ]),
      }),
    ]),
  ],
}

test('check choice', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})

const programError: Prog = {
  commands: [
    Cmd.ChooseOne([
      Branch.Choice({
        label: 'choice-1',
        cmdExpr: Expr.Cmds([
          Cmd.Exec({ fn: 'exec-choice-1', args: [] }),
          Cmd.Exec({ fn: 'exec-choice-1', args: [] }),
        ]),
      }),
      // Attempt to run a non-Cmd expression
      Branch.Choice({
        label: 'choice-2',
        cmdExpr: Expr.Lit('3'),
      }),
    ]),
  ],
}

test('check reject choice', (t) => {
  t.throws(() => typeCheck(programError), { message: "Types don't match" })
})
