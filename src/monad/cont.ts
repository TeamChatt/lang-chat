export class Cont<R, T> {
  output: R[]
  value: T
  run: (f: (t: T) => R) => R

  constructor(run: (f: (t: T) => R) => R) {
    this.run = run
  }
  static of<R, T>(value: T): Cont<R, T> {
    return new Cont((f) => f(value))
  }
  static cont<R, T>(run: (f: (t: T) => R) => R): Cont<R, T> {
    return new Cont(run)
  }
  static callCC<R, A, B>(
    f: (k: (a: A) => Cont<R, B>) => Cont<R, A>
  ): Cont<R, A> {
    return new Cont<R, A>((c) => {
      const k = (x: A) => new Cont<R, B>(() => c(x))
      return f(k).run(c)
    })
  }

  map<T2>(f: (t: T) => T2): Cont<R, T2> {
    return new Cont((g) => this.run((x: T) => g(f(x))))
  }

  flatten<T2>(): Cont<R, T2> {
    const cont = this as unknown as Cont<R, Cont<R, T2>>
    return cont.flatMap((x) => x)
  }

  flatMap<T2>(f: (t: T) => Cont<R, T2>): Cont<R, T2> {
    return new Cont((g) => this.run((x: T) => f(x).run(g)))
  }
}
