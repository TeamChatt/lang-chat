import { Try } from '../data/try'

export class TryState<S, T> {
  run: (state: S) => Try<[S, T]>

  constructor(runState: (state: S) => Try<[S, T]>) {
    this.run = runState
  }
  static of<S, T>(value: T): TryState<S, T> {
    return new TryState((state: S) => Try.of([state, value]))
  }
  static fail<S, T>(error: Error): TryState<S, T> {
    return new TryState((state: S) => Try.fail(error))
  }
  static get<S>(): TryState<S, S> {
    return new TryState((state) => Try.of([state, state]))
  }
  static set<S>(newState: S): TryState<S, undefined> {
    return new TryState(() => Try.of([newState, undefined]))
  }
  static modify<S>(f: (state: S) => S): TryState<S, undefined> {
    return TryState.get<S>().map(f).flatMap(TryState.set)
  }

  map<T2>(f: (t: T) => T2): TryState<S, T2> {
    const runMap = (state: S): Try<[S, T2]> =>
      this.run(state).map(([newState, value]) => [newState, f(value)])
    return new TryState(runMap)
  }

  flatten<T2>(): TryState<S, T2> {
    const { run: runState } = (this as unknown) as TryState<S, TryState<S, T2>>
    const runInner = (state: S) =>
      runState(state).flatMap(([innerState, innerValue]) => {
        return innerValue.run(innerState)
      })

    return new TryState(runInner)
  }

  flatMap<T2>(f: (t: T) => TryState<S, T2>): TryState<S, T2> {
    return this.map(f).flatten()
  }
}
