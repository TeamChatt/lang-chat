import test from 'ava'
import { Prog, Cmd, Expr, typeCheck } from '../../src'

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
  t.throws(() => typeCheck(programError1), {
    message: 'Expected type Cmd<Any>, but found String',
  })
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
    Cmd.Run(Expr.Var('strat')),
  ],
}

test('check reject decl-run 2', (t) => {
  t.throws(() => typeCheck(programError2), {
    message: 'Variable "strat" not defined. Did you mean "start"?',
  })
})
