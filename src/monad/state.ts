export class State<S, T> {
  run: (state: S) => [S, T]

  constructor(runState: (state: S) => [S, T]) {
    this.run = runState
  }
  static of<S, T>(value: T): State<S, T> {
    return new State((state: S) => [state, value])
  }
  static get<S>(): State<S, S> {
    return new State((state) => [state, state])
  }
  static set<S>(newState: S): State<S, undefined> {
    return new State(() => [newState, undefined])
  }
  static modify<S>(f: (state: S) => S): State<S, undefined> {
    return State.get<S>().map(f).flatMap(State.set)
  }

  map<T2>(f: (t: T) => T2): State<S, T2> {
    const runMap = (state: S): [S, T2] => {
      const [newState, value] = this.run(state)
      return [newState, f(value)]
    }
    return new State(runMap)
  }

  flatten<T2>(): State<S, T2> {
    const { run: runState } = (this as unknown) as State<S, State<S, T2>>
    const runInner = (state: S) => {
      const [innerState, innerValue] = runState(state)
      return innerValue.run(innerState)
    }
    return new State(runInner)
  }

  flatMap<T2>(f: (t: T) => State<S, T2>): State<S, T2> {
    return this.map(f).flatten()
  }
}
