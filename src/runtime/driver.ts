import { RuntimeError } from './runtime-error'

export interface Driver {
  exec: (fn: string, args: any[]) => any
  dialogue: (character: string, line: string) => any
  branch: (branches: any[]) => any
  error: (err: RuntimeError) => any
}
