export abstract class Maybe<T> {
  static just<T>(value: T): Maybe<T> {
    return new Just(value)
  }
  static nothing<T>(): Maybe<T> {
    return new Nothing<T>()
  }
  static fromNullable<T>(t?: T): Maybe<T> {
    return t === null || t === undefined ? Maybe.nothing() : Maybe.just(t)
  }

  abstract map<S>(f: (t: T) => S): Maybe<S>
  abstract flatten<S>(): Maybe<S>
  abstract maybe<R>(fromJust: (t: T) => R, defaultValue: () => R): R
  abstract alt(maybe: Maybe<T>): Maybe<T>

  flatMap<S>(f: (t: T) => Maybe<S>): Maybe<S> {
    return this.map(f).flatten()
  }
}

class Just<T> extends Maybe<T> {
  readonly value: T

  constructor(value: T) {
    super()
    this.value = value
  }

  map<S>(f: (t: T) => S): Maybe<S> {
    const { value } = this
    return Maybe.just(f(value))
  }
  flatten<S>(): Maybe<S> {
    const { value } = (this as unknown) as Just<Maybe<S>>
    return value
  }
  maybe<R>(fromJust: (t: T) => R, fromNothnig: () => R): R {
    const { value } = this
    return fromJust(value)
  }
  alt(maybe: Maybe<T>): Maybe<T> {
    return this
  }
}

class Nothing<T> extends Maybe<T> {
  map<S>(f: (t: T) => S): Maybe<S> {
    return Maybe.nothing()
  }
  flatten<S>(): Maybe<S> {
    return Maybe.nothing()
  }
  maybe<R>(fromJust: (t: T) => R, fromNothing: () => R): R {
    return fromNothing()
  }
  alt(maybe: Maybe<T>): Maybe<T> {
    return maybe
  }
}
