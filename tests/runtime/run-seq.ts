import test from 'ava'
import { testProgram, testRuntime } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'label',
      value: Expr.Cmds([Cmd.Exec({ fn: 'exec', args: [] })]),
    }),
    Cmd.Run(Expr.Var('label')),
    Cmd.Run(Expr.Var('label')),
    Cmd.Run(Expr.Var('label')),
  ],
}

const expectedOutput = [
  { fn: 'exec', args: [] },
  { fn: 'exec', args: [] },
  { fn: 'exec', args: [] },
]

test('run run-seq', testProgram, program, expectedOutput)

test('resume run-seq', testRuntime, program, expectedOutput)
