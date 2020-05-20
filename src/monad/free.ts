interface Chain<T> {
  flatMap: <S>(f: (t: T) => Chain<S>) => Chain<S>
}

export abstract class Free<S, R> {
  static impure<S, R>(next, value: S): Free<S, R> {
    return new FreeImpure(next, value)
  }
  static pure<S, R>(value: R): Free<S, R> {
    return new FreePure(value) as Free<S, R>
  }
  static lift<S, R>(cmd: S): Free<S, R> {
    return Free.impure(Free.pure, cmd)
  }

  abstract map<R2>(f: (t: R) => R2): Free<S, R2>
  abstract flatten<R2>(): Free<S, R2>
  abstract foldMap<T>(
    step: (s: S) => Chain<R>,
    done: (r: R) => Chain<T>
  ): Chain<T>

  flatMap<R2>(f: (t: R) => Free<S, R2>): Free<S, R2> {
    return this.map(f).flatten()
  }
}

class FreePure<S, Result> extends Free<S, Result> {
  readonly value: Result

  constructor(value: Result) {
    super()
    this.value = value
  }

  map<R2>(f: (t: Result) => R2): Free<S, R2> {
    const { value } = this
    return Free.pure(f(value))
  }
  flatten<R2>(): Free<S, R2> {
    const { value } = (this as unknown) as FreePure<S, Free<S, R2>>
    return value
  }
  foldMap<T>(
    step: (s: S) => Chain<Result>,
    done: (r: Result) => Chain<T>
  ): Chain<T> {
    const { value } = this
    return done(value)
  }
}

class FreeImpure<Step, R> extends Free<Step, R> {
  readonly value: Step
  readonly next: (x: R) => Free<Step, R>

  constructor(next: (x: R) => Free<Step, R>, value: Step) {
    super()
    this.next = next
    this.value = value
  }

  map<R2>(f: (x: R) => R2): Free<Step, R2> {
    const { next, value } = this
    const f_next = (x: R) => next(x).map(f)
    return Free.impure(f_next, value)
  }
  flatten<R2>(): Free<Step, R2> {
    const { next, value } = (this as unknown) as FreeImpure<
      Step,
      Free<Step, R2>
    >
    const inner_next = (x: Free<Step, R2>) => next(x).flatten()
    return Free.impure(inner_next, value)
  }
  foldMap<T>(step: (s: Step) => Chain<R>, done: (r: R) => Chain<T>): Chain<T> {
    const { next, value } = this
    return step(value).flatMap((r) => next(r).foldMap(step, done))
  }
}
