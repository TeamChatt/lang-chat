import { Prog, Cmd } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.Exec({ fn: 'exec-1', args: [] }),
    Cmd.Exec({ fn: 'exec-2', args: [] }),
    Cmd.Exec({ fn: 'exec-3', args: [] }),
    Cmd.Exec({ fn: 'exec-4', args: [] }),
  ],
}
