import { Loc } from '../static/location'
import { Maybe } from '../data/maybe'
import { Driver } from './driver'
import {
  RuntimeContext,
  lookupVar,
  defineVar,
  pushStack,
  popStack,
  forkFirst,
  forkAll,
  stepSeq,
  stepParallel,
  ParallelRuntimeContext,
  visitBranch,
  visitedBranches,
} from './runtime-context'
import { RuntimeError } from './runtime-error'
import { Choice } from './choice'

export type Effect = (driver: Driver) => any
export type Output = [RuntimeContext, Effect]

type RuntimeEffects<T> = {
  value: T
  context: RuntimeContext
  [Symbol.iterator]: () => Iterator<Output>
}

export type RuntimeThread<R> = {
  runtime: Runtime<R>
  loc: Loc
}

export class Runtime<T> {
  readonly run: (state: RuntimeContext) => RuntimeEffects<T>

  constructor(run: (state: RuntimeContext) => RuntimeEffects<T>) {
    this.run = run
  }
  // Factory Methods
  static of<T>(value: T): Runtime<T> {
    return new Runtime((context) => ({
      value,
      context,
      *[Symbol.iterator]() {},
    }))
  }
  static fromEffect(io: Effect): Runtime<undefined> {
    return new Runtime((context) => ({
      value: undefined,
      context,
      *[Symbol.iterator]() {
        yield [this.context, io]
      },
    }))
  }
  // Control Flow
  static step(loc: Loc): Runtime<undefined> {
    return new Runtime((context) => ({
      value: undefined,
      context: stepSeq(loc)(context),
      *[Symbol.iterator]() {},
    }))
  }
  static visitBranch(choice: Choice): Runtime<undefined> {
    return new Runtime((context) => ({
      value: undefined,
      context: visitBranch(choice)(context),
      *[Symbol.iterator]() {},
    }))
  }
  static visitedBranches(): Runtime<Choice[]> {
    return new Runtime((context) => ({
      value: visitedBranches(context),
      context,
      *[Symbol.iterator]() {},
    }))
  }
  static fail(reason: string): Runtime<undefined> {
    return new Runtime((context) => ({
      value: undefined,
      context,
      *[Symbol.iterator]() {
        throw new RuntimeError(reason, context)
      },
    }))
  }
  // Concurrency
  static forkFirst<T>(
    threads: RuntimeThread<T>[],
    rtContext?: ParallelRuntimeContext
  ): Runtime<undefined> {
    const runProcesses = (context) => ({
      value: undefined,
      context,
      *[Symbol.iterator]() {
        const parallelContext =
          rtContext || forkFirst(threads.map((t) => t.loc))(context)
        yield* runUntilFirst(threads, parallelContext)
      },
    })
    return new Runtime(runProcesses)
  }
  static forkAll<T>(
    threads: RuntimeThread<T>[],
    rtContext?: ParallelRuntimeContext
  ): Runtime<undefined> {
    const runProcesses = (context) => ({
      value: undefined,
      context,
      *[Symbol.iterator]() {
        const parallelContext =
          rtContext || forkAll(threads.map((t) => t.loc))(context)
        yield* runAll(threads, parallelContext)
      },
    })
    return new Runtime(runProcesses)
  }
  // Binding
  static pushStack(): Runtime<undefined> {
    return new Runtime((context) => ({
      value: undefined,
      context: pushStack(context),
      *[Symbol.iterator]() {},
    }))
  }
  static popStack(): Runtime<undefined> {
    return new Runtime((context) => ({
      value: undefined,
      context: popStack(context),
      *[Symbol.iterator]() {},
    }))
  }
  static defineVar(variable: string, value): Runtime<undefined> {
    return new Runtime((context) => ({
      value: undefined,
      context: defineVar(variable, value)(context),
      *[Symbol.iterator]() {},
    }))
  }
  static lookupVar(variable: string): Runtime<Maybe<any>> {
    return new Runtime((context) => ({
      value: lookupVar(variable)(context),
      context,
      *[Symbol.iterator]() {},
    }))
  }

  map<R>(f: (t: T) => R): Runtime<R> {
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
    return new Runtime(runMap)
  }

  flatten<S>(): Runtime<S> {
    const { run: runOuter } = (this as unknown) as Runtime<Runtime<S>>
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
    return new Runtime(runInner)
  }

  flatMap<R>(f: (t: T) => Runtime<R>): Runtime<R> {
    return this.map(f).flatten()
  }
}

// Thread concurrency
function* runUntilFirst<T>(
  threads: RuntimeThread<T>[],
  context: ParallelRuntimeContext
): Generator<Output> {
  let parallelContext = context
  let threadQueue = threads
    .map((t) => t.runtime)
    .map((t, i) => t.run(parallelContext.threads[i])[Symbol.iterator]())
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
  threads: RuntimeThread<T>[],
  context: ParallelRuntimeContext
): Generator<Output> {
  let parallelContext = context
  let threadQueue = threads
    .map((t) => t.runtime)
    .map((t, i) => t.run(parallelContext.threads[i])[Symbol.iterator]())
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
