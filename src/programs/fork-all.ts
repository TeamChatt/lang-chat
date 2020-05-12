import { Prog, Branch, Cmd } from '../static/ast'

export const program: Prog = {
  commands: [
    Cmd.ForkAll([
      Branch.Fork([Cmd.Exec({ fn: 'exec-from-fork-1', args: [] })]),
      Branch.Fork([Cmd.Exec({ fn: 'exec-from-fork-2', args: [] })]),
    ]),
  ],
}
