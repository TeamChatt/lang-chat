import test from 'ava'
import { testProgram } from '../helpers'
import { Prog, Cmd, Expr } from '../../src/static/ast'

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

const expectedOutput = ['exec-1', 'exec-2']

test('run decl-run', testProgram, program, expectedOutput)
