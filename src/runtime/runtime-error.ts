import { RuntimeContext } from './runtime-context'

export class RuntimeError extends Error {
  readonly context: RuntimeContext

  constructor(reason: string, context: RuntimeContext) {
    super(reason)
    this.context = context
    this.name = 'RuntimeError'
  }
}
