import test from 'ava'
import { typeCheck } from '../../src/static/type-check'
import { Prog, Cmd, Expr } from '../../src/static/ast'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Cmds([
        Cmd.Exec({ fn: 'exec1', args: [] }),
        Cmd.Exec({ fn: 'exec2', args: [] }),
      ]),
    }),
    Cmd.Run(Expr.Var('start')),
  ],
}

test('check decl-run', (t) => {
  const result = typeCheck(program)
  t.deepEqual(result, program)
})

const programError1: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Lit('3'),
    }),
    // Attempt to run non-Cmd type
    Cmd.Run(Expr.Var('start')),
  ],
}

test('check reject decl-run 1', (t) => {
  t.throws(() => typeCheck(programError1), { message: "Types don't match" })
})

const programError2: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Cmds([
        Cmd.Exec({ fn: 'exec1', args: [] }),
        Cmd.Exec({ fn: 'exec2', args: [] }),
      ]),
    }),
    // Attempt to run variable not in scope
    Cmd.Run(Expr.Var('not-start')),
  ],
}

test('check reject decl-run 2', (t) => {
  t.throws(() => typeCheck(programError2), { message: 'Variable not in scope' })
})
