import { Stream } from 'xstream'
import Defer from '../util/defer'
import { Loc } from '../static/location'
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
} from './runtime-context'

export type Effect<T> = () => Promise<T>
export type Output = [RuntimeContext, Effect<any>]

type RuntimeResult<T> = {
  context: RuntimeContext
  value: T
}
type RuntimeEffects<T> = {
  result: Promise<RuntimeResult<T>>
  output: Stream<Output>
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
      result: Promise.resolve({
        context,
        value,
      }),
      output: Stream.empty(),
    }))
  }
  static fromEffect<T>(io: Effect<T>): Runtime<T> {
    return new Runtime((context) => {
      const defer = Defer<T>()
      const effect = async () => {
        const v = await io()
        defer.resolve(v)
        return v
      }
      return {
        result: defer.then((value) => ({ context, value })),
        output: Stream.of([context, effect]),
      }
    })
  }
  // Control Flow
  static step(loc: Loc): Runtime<undefined> {
    return new Runtime((context) => ({
      result: Promise.resolve({
        context: stepSeq(loc)(context),
        value: undefined,
      }),
      output: Stream.empty(),
    }))
  }
  // Concurrency
  static forkFirst<T>(
    threads: RuntimeThread<T>[],
    rtContext?: ParallelRuntimeContext
  ): Runtime<undefined> {
    const runProcesses = (context) => {
      const parallelContext =
        rtContext || forkFirst(threads.map((t) => t.loc))(context)
      const output = runUntilFirst(threads, parallelContext)
      return {
        // TODO: only resolve after threads have completed
        result: Promise.resolve({
          context,
          value: undefined,
        }),
        output,
      }
    }
    return new Runtime(runProcesses)
  }
  static forkAll<T>(
    threads: RuntimeThread<T>[],
    rtContext?: ParallelRuntimeContext
  ): Runtime<undefined> {
    const runProcesses = (context) => {
      const parallelContext =
        rtContext || forkAll(threads.map((t) => t.loc))(context)
      const output = runAll(threads, parallelContext)
      return {
        // TODO: only resolve after threads have completed
        result: Promise.resolve({
          context,
          value: undefined,
        }),
        output,
      }
    }
    return new Runtime(runProcesses)
  }
  // Binding
  static pushStack(): Runtime<undefined> {
    return new Runtime((context) => ({
      result: Promise.resolve({
        context: pushStack(context),
        value: undefined,
      }),
      output: Stream.empty(),
    }))
  }
  static popStack(): Runtime<undefined> {
    return new Runtime((context) => ({
      result: Promise.resolve({
        context: popStack(context),
        value: undefined,
      }),
      output: Stream.empty(),
    }))
  }
  static defineVar(variable: string, value): Runtime<undefined> {
    return new Runtime((context) => ({
      result: Promise.resolve({
        context: defineVar(variable, value)(context),
        value: undefined,
      }),
      output: Stream.empty(),
    }))
  }
  static lookupVar(variable: string): Runtime<any> {
    return new Runtime((context) => ({
      result: Promise.resolve({
        context,
        value: lookupVar(variable)(context),
      }),
      output: Stream.empty(),
    }))
  }

  map<R>(f: (t: T) => R): Runtime<R> {
    const runMap = (context: RuntimeContext) => {
      const effects = this.run(context)
      return {
        result: effects.result.then(({ context, value }) => ({
          context,
          value: f(value),
        })),
        output: effects.output,
      }
    }
    return new Runtime(runMap)
  }

  //TODO: is there a better way to type this?
  flatten<S>(): Runtime<S> {
    const { run: runOuter } = (this as unknown) as Runtime<Runtime<S>>
    const runInner = (context: RuntimeContext) => {
      const outer = runOuter(context)
      const asyncInner = outer.result.then(({ context, value }) =>
        value.run(context)
      )
      const innerResult = asyncInner.then(({ result }) => result)
      const innerOutput = Stream.fromPromise(
        asyncInner.then(({ output }) => output)
      ).flatten()

      return {
        result: innerResult,
        output: Stream.merge(outer.output, innerOutput), // TODO: should this be concat instead?
      }
    }
    return new Runtime(runInner)
  }

  flatMap<R>(f: (t: T) => Runtime<R>): Runtime<R> {
    return this.map(f).flatten()
  }
}

// Thread concurrency
const runUntilFirst = <T>(
  threads: RuntimeThread<T>[],
  context: ParallelRuntimeContext
): Stream<Output> => {
  let parallelContext = context
  let threadQueue = threads
    .map((t) => t.runtime)
    .map((t, i) => t.run(parallelContext.threads[i])[Symbol.iterator]())
  let contextQueue = parallelContext.threads

  //TODO: run threads in parallel. Aggregate output tagged with correct runtime contexts
  return Stream.empty()
}

const runAll = <T>(
  threads: RuntimeThread<T>[],
  context: ParallelRuntimeContext
): Stream<Output> => {
  let parallelContext = context
  let threadQueue = threads
    .map((t) => t.runtime)
    .map((t, i) => t.run(parallelContext.threads[i])[Symbol.iterator]())
  let contextQueue = parallelContext.threads

  //TODO: run threads in parallel. Aggregate output tagged with correct runtime contexts
  return Stream.empty()
}
