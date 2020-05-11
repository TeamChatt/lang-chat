import {
  RuntimeContext,
  lookupVar,
  defineVar,
  pushStack,
  popStack,
  spawn,
} from './runtime-context'

export type Effect = () => any
export type Output = [RuntimeContext, Effect]

type RuntimeEffects<T> = {
  value: T
  state: RuntimeContext
  [Symbol.iterator]: () => Iterator<Output>
}

export class RuntimeSync<T> {
  readonly runThread: (state: RuntimeContext) => RuntimeEffects<T>

  constructor(runThread: (state: RuntimeContext) => RuntimeEffects<T>) {
    this.runThread = runThread
  }
  // Factory Methods
  static of<T>(value: T): RuntimeSync<T> {
    return new RuntimeSync((state) => ({
      value,
      state,
      *[Symbol.iterator]() {},
    }))
  }
  static fromEffect(io: Effect): RuntimeSync<undefined> {
    return new RuntimeSync((state) => ({
      value: undefined,
      state,
      *[Symbol.iterator]() {
        yield [state, io]
      },
    }))
  }
  // Concurrency
  static forkFirst<T>(processes: RuntimeSync<T>[]): RuntimeSync<undefined> {
    const runProcesses = (state) => {
      const newState = spawn(state)
      const effects = processes.map((t) => t.runThread(newState))
      return {
        value: undefined,
        state,
        *[Symbol.iterator]() {
          yield* [] // TODO: runUntilFirst(effects)
        },
      }
    }
    return new RuntimeSync(runProcesses)
  }
  static forkAll<T>(processes: RuntimeSync<T>[]): RuntimeSync<undefined> {
    const runProcesses = (state) => {
      const newState = spawn(state)
      const effects = processes.map((t) => t.runThread(newState))
      return {
        value: undefined,
        state,
        *[Symbol.iterator]() {
          yield* [] // TODO: runAll(effects)
        },
      }
    }
    return new RuntimeSync(runProcesses)
  }
  // Binding
  static pushStack(): RuntimeSync<undefined> {
    return new RuntimeSync((state) => ({
      value: undefined,
      state: pushStack(state),
      *[Symbol.iterator]() {},
    }))
  }
  static popStack(): RuntimeSync<undefined> {
    return new RuntimeSync((state) => ({
      value: undefined,
      state: popStack(state),
      *[Symbol.iterator]() {},
    }))
  }
  static defineVar(variable: string, value): RuntimeSync<undefined> {
    return new RuntimeSync((state) => ({
      value: undefined,
      state: defineVar(variable, value)(state),
      *[Symbol.iterator]() {},
    }))
  }
  static lookupVar(variable: string): RuntimeSync<any> {
    return new RuntimeSync((state) => ({
      value: lookupVar(variable)(state),
      state,
      *[Symbol.iterator]() {},
    }))
  }

  map<R>(f: (t: T) => R): RuntimeSync<R> {
    const runMap = (state: RuntimeContext) => {
      const effects = this.runThread(state)
      return {
        value: f(effects.value),
        state: effects.state,
        *[Symbol.iterator]() {
          yield* effects
        },
      }
    }
    return new RuntimeSync(runMap)
  }

  //TODO: is there a better way to type this?
  flatten<S>(): RuntimeSync<S> {
    const { runThread } = (this as unknown) as RuntimeSync<RuntimeSync<S>>
    const runInner = (state: RuntimeContext) => {
      const outer = runThread(state)
      const inner = outer.value.runThread(outer.state)

      return {
        value: inner.value,
        state: inner.state,
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

// Iterable concurrency
function* runUntilFirst<T>(iterables: Iterable<T>[]) {
  let iterators = iterables.map((p) => p[Symbol.iterator]())
  // Interleave processes round-robin style
  while (iterators.length > 0) {
    const [i, ...rest] = iterators
    const { value, done } = i.next()
    if (done) {
      break // exit early
    } else {
      yield value
      iterators = [...rest, i]
    }
  }
}
function* runAll<T>(iterables: Iterable<T>[]) {
  let iterators = iterables.map((p) => p[Symbol.iterator]())
  // Interleave processes round-robin style
  while (iterators.length > 0) {
    const [i, ...rest] = iterators
    const { value, done } = i.next()
    if (done) {
      iterators = rest
    } else {
      yield value
      iterators = [...rest, i]
    }
  }
}
