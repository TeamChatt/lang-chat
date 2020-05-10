export class AsyncIO<T> {
  readonly run: () => Promise<T>

  constructor(run) {
    this.run = run
  }
  static impure<T>(run: () => Promise<T>): AsyncIO<T> {
    return new AsyncIO(run)
  }
  static of<T>(value: T): AsyncIO<T> {
    return new AsyncIO(async () => value)
  }
  static interleave<T>(threads: AsyncIO<T>[]): AsyncIO<T[]> {
    const runAll = async () => await Promise.all(threads.map((t) => t.run()))
    return AsyncIO.impure(runAll)
  }
  static race<T>(threads: AsyncIO<T>[]): AsyncIO<T> {
    const runAll = async () => await Promise.race(threads.map((t) => t.run()))
    return AsyncIO.impure(runAll)
  }

  map<R>(f: (t: T) => R): AsyncIO<R> {
    const { run } = this
    const runNext = async () => f(await run())
    return AsyncIO.impure(runNext)
  }

  // where T = AsyncIO<S>
  flatten<S>(): AsyncIO<S> {
    const { run } = (this as unknown) as AsyncIO<AsyncIO<S>>
    const runInner = async () => (await run()).run()
    return AsyncIO.impure(runInner)
  }

  flatMap<R>(f: (t: T) => AsyncIO<R>): AsyncIO<R> {
    return this.map(f).flatten()
  }
}
