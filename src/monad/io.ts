export class IO<T> {
  readonly run: () => T

  constructor(run) {
    this.run = run
  }
  static impure<T>(run): IO<T> {
    return new IO(run)
  }
  static pure<T>(value: T): IO<T> {
    return new IO(() => value)
  }
  static of<T>(value: T): IO<T> {
    return IO.pure(value)
  }

  map<R>(f: (t: T) => R): IO<R> {
    const { run } = this
    const runNext = () => f(run())
    return IO.impure(runNext)
  }

  flatten<S>(): IO<S> {
    return flattenIO((this as unknown) as IO<IO<S>>)
  }

  flatMap<R>(f: (t: T) => IO<R>): IO<R> {
    return this.map(f).flatten()
  }
}

const flattenIO = <T>(io: IO<IO<T>>): IO<T> => {
  const { run } = io
  const runInner = () => run().run()
  return IO.impure(runInner)
}
