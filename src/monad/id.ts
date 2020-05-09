export class Id<T> {
  value: T

  constructor(value: T) {
    this.value = value
  }
  static of<T>(value: T) {
    return new Id(value)
  }

  map<S>(f: (t: T) => S): Id<S> {
    return new Id(f(this.value))
  }

  flatten() {
    return this.value
  }

  flatMap<S>(f: (t: T) => Id<S>): Id<S> {
    return this.map(f).flatten()
  }
}
