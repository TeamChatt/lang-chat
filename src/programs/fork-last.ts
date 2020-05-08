import { Prog, Branch, Cmd } from '../ast'

export const program: Prog = {
  commands: [
    Cmd.ForkLast([
      Branch.Fork([Cmd.Exec({ fn: 'exec-from-fork-1', args: [] })]),
      Branch.Fork([Cmd.Exec({ fn: 'exec-from-fork-2', args: [] })]),
    ]),
  ],
}
