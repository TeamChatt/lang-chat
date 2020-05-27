export abstract class Try<T> {
  static of<T>(value: T): Try<T> {
    return new Success(value)
  }
  static fail<T>(error): Try<T> {
    return new Fail<T>(error)
  }
  static fromAction<T>(action: () => T): Try<T> {
    try {
      return new Success(action())
    } catch (error) {
      return new Fail<T>(error)
    }
  }

  abstract map<S>(f: (t: T) => S): Try<S>
  abstract flatten<S>(): Try<S>
  abstract alt(maybe: Try<T>): Try<T>
  abstract coerce(): T

  flatMap<S>(f: (t: T) => Try<S>): Try<S> {
    return this.map(f).flatten()
  }
}

class Success<T> extends Try<T> {
  readonly value: T

  constructor(value: T) {
    super()
    this.value = value
  }

  map<S>(f: (t: T) => S): Try<S> {
    const { value } = this
    return Try.of(f(value))
  }
  flatten<S>(): Try<S> {
    const { value } = (this as unknown) as Success<Try<S>>
    return value
  }
  alt(attempt: Try<T>): Try<T> {
    return this
  }
  coerce(): T {
    return this.value
  }
}

class Fail<T> extends Try<T> {
  readonly error: Error

  constructor(error: Error) {
    super()
    this.error = error
  }

  map<S>(f: (t: T) => S): Try<S> {
    return (this as unknown) as Try<S>
  }
  flatten<S>(): Try<S> {
    return (this as unknown) as Try<S>
  }
  alt(attempt: Try<T>): Try<T> {
    return attempt
  }
  coerce(): T {
    throw this.error
  }
}
