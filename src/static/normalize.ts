import { Writer } from '../monad/writer'
import { Prog, Cmd, Expr } from './ast'
import { visitM } from './transformM'

let temp = 0
const makeTemp = (): string => `__temp__${temp++}`

//-----------------------------------------------------------------------------
// Normalization
//-----------------------------------------------------------------------------

const transformer = visitM(Writer.of)({
  Expr: {
    'Expr.Cmd': ({ cmd }) => {
      const [c, cmds] = normalizeCmd(cmd).run()
      return cmds.length === 0
        ? Writer.of(Expr.Cmd(c))
        : Writer.of(Expr.Cmds([...cmds, c]))
    },
    'Expr.Cmds': ({ cmds }) => {
      const commands = normalizeCmds(cmds)
      return Writer.of(Expr.Cmds(commands))
    },
    'Expr.Result': ({ cmdExpr }) => {
      const cmdExprM = transformer.Expr(cmdExpr)
      return cmdExprM.flatMap((cmdExpr) => {
        const temp = makeTemp()
        const def = Cmd.Def({ variable: temp, value: Expr.Result(cmdExpr) })
        return Writer.tell(def).flatMap(() => Writer.of(Expr.Var(temp)))
      })
    },
  },
})
const transformerDeep = visitM(Writer.of)({
  Expr: {
    'Expr.Result': ({ cmdExpr }) => {
      const cmdExprM = transformerDeep.Expr(cmdExpr)
      return cmdExprM.flatMap((cmdExpr) => {
        const temp = makeTemp()
        const def = Cmd.Def({ variable: temp, value: Expr.Result(cmdExpr) })
        return Writer.tell(def).flatMap(() => Writer.of(Expr.Var(temp)))
      })
    },
    // TODO: If any branch contains a Expr.Result(cmdExpr),
    // promote all branches to cmd with 'Cmd.Return'.
    // Lift Result outside of Expr.Cond
    'Expr.Cond': (e) => Writer.of<Cmd, Expr>(e),
  },
})

const normalizeCmd = (cmd: Cmd) => transformer.Cmd(cmd) as Writer<Cmd, Cmd>

const normalizeCmds = (cmds: Cmd[]): Cmd[] =>
  cmds.map(normalizeCmd).flatMap((writer) => {
    const [cmd, cmds] = writer.run()
    return [...cmds, cmd]
  })

export const normalize = (program: Prog): Prog => {
  const { commands } = program
  return { commands: normalizeCmds(commands) }
}
