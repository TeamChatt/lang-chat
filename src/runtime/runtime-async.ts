import { Stream } from 'xstream'
import Defer from '../util/defer'
import { Maybe } from '../data/maybe'
import { Loc } from '../static/location'
import { Choice } from './choice'
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

export type Effect<T> = (driver: Driver) => Promise<T>
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
      const effect = async (driver) => {
        const v = await io(driver)
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
  static visitedBranches(): Runtime<Choice[]> {
    return new Runtime((context) => ({
      result: Promise.resolve({
        context,
        value: visitedBranches(context),
      }),
      output: Stream.empty(),
    }))
  }
  static visitBranch(choice: Choice): Runtime<undefined> {
    return new Runtime((context) => ({
      result: Promise.resolve({
        context: visitBranch(choice)(context),
        value: undefined,
      }),
      output: Stream.empty(),
    }))
  }
  static fail(reason: string): Runtime<undefined> {
    return new Runtime((context) => ({
      result: new Promise((resolve) => {}), // Never resolve
      output: Stream.throw(new RuntimeError(reason, context)),
    }))
  }
  // Concurrency
  static forkFirst<T>(
    threads: RuntimeThread<T>[],
    rtContext?: ParallelRuntimeContext
  ): Runtime<T> {
    const runProcesses = (context) => {
      const parallelContext =
        rtContext || forkFirst(threads.map((t) => t.loc))(context)
      const effects = threads.map((t, i) =>
        t.runtime.run(parallelContext.threads[i])
      )
      return runUntilFirst(effects, context, parallelContext)
    }
    return new Runtime(runProcesses)
  }
  static forkAll<T>(
    threads: RuntimeThread<T>[],
    rtContext?: ParallelRuntimeContext
  ): Runtime<T[]> {
    const runProcesses = (context) => {
      const parallelContext =
        rtContext || forkAll(threads.map((t) => t.loc))(context)
      const effects = threads.map((t, i) =>
        t.runtime.run(parallelContext.threads[i])
      )
      return runAll(effects, context, parallelContext)
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
  static lookupVar(variable: string): Runtime<Maybe<any>> {
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
const set = (i, value, arr) => {
  const newArr = [...arr]
  newArr[i] = value
  return newArr
}
type UpdateOutput = (ctx: ParallelRuntimeContext) => Output
const mergeOutput = (
  outputs: Stream<Output>[],
  context: ParallelRuntimeContext
): Stream<Output> => {
  const streams: Stream<UpdateOutput>[] = outputs.map((output, i) =>
    output.map(([context, effect]) => (parallelContext) => {
      const newThreads = set(i, context, parallelContext.threads)
      const newContext = stepParallel(newThreads)(parallelContext)
      return [newContext, effect]
    })
  )

  return Stream.merge(...streams)
    .fold(
      (output: Output, f) => {
        const [context, effect] = output
        const [newContext, newEffect] = f(context as ParallelRuntimeContext)
        return [newContext, newEffect] as Output
      },
      [context, () => Promise.resolve(undefined)]
    )
    .drop(1)
}

const runUntilFirst = <T>(
  effects: RuntimeEffects<T>[],
  context: RuntimeContext,
  parallelContext: ParallelRuntimeContext
): RuntimeEffects<T> => {
  const result = Promise.race(effects.map((e) => e.result)).then((r) => ({
    value: r.value,
    context,
  }))
  const output = mergeOutput(
    effects.map((e) => e.output),
    parallelContext
  ).endWhen(Stream.fromPromise(result))
  return {
    result,
    output,
  }
}

const runAll = <T>(
  effects: RuntimeEffects<T>[],
  context: RuntimeContext,
  parallelContext: ParallelRuntimeContext
): RuntimeEffects<T[]> => {
  const result = Promise.all(effects.map((e) => e.result)).then((results) => ({
    value: results.map((r) => r.value),
    context,
  }))
  const output = mergeOutput(
    effects.map((e) => e.output),
    parallelContext
  )
  return {
    result,
    output,
  }
}
