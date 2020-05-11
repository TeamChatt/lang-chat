type RuntimeState = {}

const bindVar = (
  variable: string,
  value: any,
  state: RuntimeState
): RuntimeState => ({
  [variable]: value,
  ...state,
})

const lookupVar = (variable: string, state: RuntimeState): any =>
  state[variable]

type RuntimeEffects<T> = {
  value: T
  state: RuntimeState
  [Symbol.iterator]: () => Iterator<Effect>
}

export type Effect = () => any

export class RuntimeSync<T> {
  readonly runThread: (state: RuntimeState) => RuntimeEffects<T>

  constructor(runThread: (state: RuntimeState) => RuntimeEffects<T>) {
    this.runThread = runThread
  }
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
        yield io
      },
    }))
  }
  // Concurrency
  static forkFirst<T>(processes: RuntimeSync<T>[]): RuntimeSync<undefined> {
    const runProcesses = (state) => {
      const effects = processes.map((t) => t.runThread(state))
      return {
        value: undefined,
        state,
        *[Symbol.iterator]() {
          yield* runUntilFirst(effects)
        },
      }
    }
    return new RuntimeSync(runProcesses)
  }
  static forkAll<T>(processes: RuntimeSync<T>[]): RuntimeSync<undefined> {
    const runProcesses = (state) => {
      const effects = processes.map((t) => t.runThread(state))
      return {
        value: undefined,
        state,
        *[Symbol.iterator]() {
          yield* runAll(effects)
        },
      }
    }
    return new RuntimeSync(runProcesses)
  }
  // Binding
  static pushStack(): RuntimeSync<undefined> {
    return new RuntimeSync((state) => ({
      value: undefined,
      state, //TODO: need to push to stack
      *[Symbol.iterator]() {},
    }))
  }
  static popStack(): RuntimeSync<undefined> {
    return new RuntimeSync((state) => ({
      value: undefined,
      state, //TODO: need to pop from stack
      *[Symbol.iterator]() {},
    }))
  }
  static defineVar(variable: string, value): RuntimeSync<undefined> {
    return new RuntimeSync((state) => ({
      value: undefined,
      state: bindVar(variable, value, state),
      *[Symbol.iterator]() {},
    }))
  }
  static lookupVar(variable: string): RuntimeSync<any> {
    return new RuntimeSync((state) => ({
      value: lookupVar(variable, state),
      state,
      *[Symbol.iterator]() {},
    }))
  }

  map<R>(f: (t: T) => R): RuntimeSync<R> {
    const runMap = (state: RuntimeState) => {
      const output = this.runThread(state)
      return {
        value: f(output.value),
        state: output.state,
        *[Symbol.iterator]() {
          yield* output
        },
      }
    }
    return new RuntimeSync(runMap)
  }

  //TODO: is there a better way to type this?
  flatten<S>(): RuntimeSync<S> {
    const { runThread } = (this as unknown) as RuntimeSync<RuntimeSync<S>>
    const runInner = (state: RuntimeState) => {
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
function* runUntilFirst(iterables: Iterable<Effect>[]) {
  let iterators: Iterator<Effect>[] = iterables.map((p) => p[Symbol.iterator]())
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
function* runAll(iterables: Iterable<Effect>[]) {
  let iterators: Iterator<Effect>[] = iterables.map((p) => p[Symbol.iterator]())
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
