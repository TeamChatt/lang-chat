import {
  RuntimeContext,
  ParallelRuntimeContext,
  lookupVar,
  defineVar,
  pushStack,
  popStack,
  forkFirst,
  forkAll,
  stepParallel,
} from './runtime-context'

export type Effect = () => any
export type Output = [RuntimeContext, Effect]

type RuntimeEffects<T> = {
  value: T
  context: RuntimeContext
  [Symbol.iterator]: () => Iterator<Output>
}

export class RuntimeSync<T> {
  readonly run: (state: RuntimeContext) => RuntimeEffects<T>

  constructor(run: (state: RuntimeContext) => RuntimeEffects<T>) {
    this.run = run
  }
  // Factory Methods
  static of<T>(value: T): RuntimeSync<T> {
    return new RuntimeSync((context) => ({
      value,
      context,
      *[Symbol.iterator]() {},
    }))
  }
  static fromEffect(io: Effect): RuntimeSync<undefined> {
    return new RuntimeSync((context) => ({
      value: undefined,
      context,
      *[Symbol.iterator]() {
        yield [context, io]
      },
    }))
  }
  // Concurrency
  static forkFirst<T>(processes: RuntimeSync<T>[]): RuntimeSync<undefined> {
    const runProcesses = (context) => ({
      value: undefined,
      context,
      *[Symbol.iterator]() {
        yield* runUntilFirst(processes, context)
      },
    })
    return new RuntimeSync(runProcesses)
  }
  static forkAll<T>(processes: RuntimeSync<T>[]): RuntimeSync<undefined> {
    const runProcesses = (context) => ({
      value: undefined,
      context,
      *[Symbol.iterator]() {
        yield* runAll(processes, context)
      },
    })
    return new RuntimeSync(runProcesses)
  }
  // Binding
  static pushStack(): RuntimeSync<undefined> {
    return new RuntimeSync((context) => ({
      value: undefined,
      context: pushStack(context),
      *[Symbol.iterator]() {},
    }))
  }
  static popStack(): RuntimeSync<undefined> {
    return new RuntimeSync((context) => ({
      value: undefined,
      context: popStack(context),
      *[Symbol.iterator]() {},
    }))
  }
  static defineVar(variable: string, value): RuntimeSync<undefined> {
    return new RuntimeSync((context) => ({
      value: undefined,
      context: defineVar(variable, value)(context),
      *[Symbol.iterator]() {},
    }))
  }
  static lookupVar(variable: string): RuntimeSync<any> {
    return new RuntimeSync((context) => ({
      value: lookupVar(variable)(context),
      context,
      *[Symbol.iterator]() {},
    }))
  }

  map<R>(f: (t: T) => R): RuntimeSync<R> {
    const runMap = (context: RuntimeContext) => {
      const effects = this.run(context)
      return {
        value: f(effects.value),
        context: effects.context,
        *[Symbol.iterator]() {
          yield* effects
        },
      }
    }
    return new RuntimeSync(runMap)
  }

  //TODO: is there a better way to type this?
  flatten<S>(): RuntimeSync<S> {
    const { run: runOuter } = (this as unknown) as RuntimeSync<RuntimeSync<S>>
    const runInner = (context: RuntimeContext) => {
      const outer = runOuter(context)
      const inner = outer.value.run(outer.context)

      return {
        value: inner.value,
        context: inner.context,
        *[Symbol.iterator]() {
          yield* outer
          yield* inner
        },
      }
    }
    return new RuntimeSync(runInner)
  }

  flatMap<R>(f: (t: T) => RuntimeSync<R>): RuntimeSync<R> {
    return this.map(f).flatten()
  }
}

// Thread concurrency
function* runUntilFirst<T>(
  processes: RuntimeSync<T>[],
  context: RuntimeContext
): Generator<Output> {
  let parallelContext = forkFirst(processes.length)(context)
  let threadQueue = processes.map((t, i) =>
    t.run(parallelContext.threads[i])[Symbol.iterator]()
  )
  let contextQueue = parallelContext.threads

  // Interleave processes round-robin style
  while (threadQueue.length > 0) {
    const [thread, ...restThreads] = threadQueue
    const [context, ...restContexts] = contextQueue

    const { value, done } = thread.next()
    if (done) {
      break // exit early
    } else {
      const [newContext, effect] = value
      threadQueue = [...restThreads, thread]
      contextQueue = [...restContexts, newContext]
      parallelContext = stepParallel(contextQueue)(parallelContext)
      yield [parallelContext, effect]
    }
  }
}

function* runAll<T>(
  processes: RuntimeSync<T>[],
  context: RuntimeContext
): Generator<Output> {
  let parallelContext = forkAll(processes.length)(context)
  let threadQueue = processes.map((t, i) =>
    t.run(parallelContext.threads[i])[Symbol.iterator]()
  )
  let contextQueue = parallelContext.threads

  // Interleave processes round-robin style
  while (threadQueue.length > 0) {
    const [thread, ...restThreads] = threadQueue
    const [context, ...restContexts] = contextQueue

    const { value, done } = thread.next()
    if (done) {
      threadQueue = [...restThreads]
      contextQueue = [...restContexts]
      parallelContext = stepParallel(contextQueue)(parallelContext)
    } else {
      const [newContext, effect] = value
      threadQueue = [...restThreads, thread]
      contextQueue = [...restContexts, newContext]
      parallelContext = stepParallel(contextQueue)(parallelContext)
      yield [parallelContext, effect]
    }
  }
}
