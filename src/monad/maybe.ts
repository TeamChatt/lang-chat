export abstract class Maybe<T> {
  static just<T>(value: T): Maybe<T> {
    return new Just<T>(value)
  }
  static nothing<T>(): Maybe<T> {
    return new Nothing() as Maybe<T>
  }

  abstract map<S>(f: (t: T) => S): Maybe<S>
  abstract flatten() // TODO: how to type this?
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
  flatten() {
    const { value } = this
    return value
  }
  maybe<R>(fromJust: (t: T) => R, defaultValue: () => R): R {
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
  flatten() {
    return Maybe.nothing()
  }
  maybe<R>(fromJust: (t: T) => R, defaultValue: () => R): R {
    return defaultValue()
  }
  alt(maybe: Maybe<T>): Maybe<T> {
    return maybe
  }
}
