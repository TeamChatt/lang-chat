import test from 'ava'
import { testProgram, testRuntime } from '../helpers'
import { Prog, Cmd, Expr } from '../../src'

const program: Prog = {
  commands: [
    Cmd.Def({
      variable: 'start',
      value: Expr.Cmds([
        Cmd.Exec({ fn: 'exec-1', args: [] }),
        Cmd.Exec({ fn: 'exec-2', args: [] }),
      ]),
    }),
    Cmd.Run(Expr.Var('start')),
  ],
}

const expectedOutput = [
  { fn: 'exec-1', args: [] },
  { fn: 'exec-2', args: [] },
]

test('run decl-run', testProgram, program, expectedOutput)

test('resume decl-run', testRuntime, program, expectedOutput)
