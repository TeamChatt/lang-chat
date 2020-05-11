import {
  Future,
  FutureInstance,
  attemptP,
  resolve,
  map,
  chain,
  race,
  never,
  both,
  fork,
} from 'fluture'

type Future<T> = FutureInstance<any, T>

export class AsyncIO<T> {
  readonly future: Future<T>

  constructor(future: Future<T>) {
    this.future = future
  }
  static fromFuture<T>(future: Future<T>): AsyncIO<T> {
    return new AsyncIO(future)
  }
  static fromPromise<T>(run: () => Promise<T>): AsyncIO<T> {
    const future = attemptP(run)
    return new AsyncIO(future)
  }
  static of<T>(value: T): AsyncIO<T> {
    return new AsyncIO(resolve(value))
  }
  static interleave<T>(threads: AsyncIO<T>[]): AsyncIO<T[]> {
    const futures = threads.map((t) => t.future)
    const merged = futures.reduce((acc, f) => {
      const t = both(acc)(f)
      return map(([xs, x]) => [...xs, x])(t)
    }, resolve([]) as Future<T[]>)
    return AsyncIO.fromFuture(merged)
  }

  static race<T>(threads: AsyncIO<T>[]): AsyncIO<T> {
    const futures = threads.map((t) => t.future)
    const raced = futures.reduce((f1, f2) => race(f1)(f2), never)
    return AsyncIO.fromFuture(raced)
  }

  run() {
    const success = () => {}
    const failure = () => {
      throw new Error()
    }
    fork(failure)(success)(this.future)
  }

  map<R>(f: (t: T) => R): AsyncIO<R> {
    const { future: run } = this
    return AsyncIO.fromFuture(map(f)(run))
  }

  // where T = AsyncIO<S>
  flatten<S>(): AsyncIO<S> {
    const { future } = (this as unknown) as AsyncIO<AsyncIO<S>>
    const innerFuture = chain((x: AsyncIO<S>) => x.future)(future)
    return AsyncIO.fromFuture(innerFuture)
  }

  flatMap<R>(f: (t: T) => AsyncIO<R>): AsyncIO<R> {
    return this.map(f).flatten()
  }
}
