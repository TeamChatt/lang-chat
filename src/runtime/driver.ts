import { RuntimeError } from './runtime-error'

export interface Driver {
  exec: (fn: string, args: any[]) => any
  branch: (branches: any[]) => any
  error: (err: RuntimeError) => any
}
