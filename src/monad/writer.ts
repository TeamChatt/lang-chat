export class Writer<O, T> {
  output: O[]
  value: T

  constructor(output: O[], value: T) {
    this.output = output
    this.value = value
  }
  static of<O, T>(value: T): Writer<O, T> {
    return new Writer([], value)
  }
  static tell<O>(output: O): Writer<O, undefined> {
    return new Writer([output], undefined)
  }

  map<T2>(f: (t: T) => T2): Writer<O, T2> {
    const { output, value } = this
    return new Writer(output, f(value))
  }

  flatten<T2>(): Writer<O, T2> {
    const { output, value } = this as unknown as Writer<O, Writer<O, T2>>
    const combinedOutput = [...output, ...value.output]
    const innerValue = value.value
    return new Writer(combinedOutput, innerValue)
  }

  flatMap<T2>(f: (t: T) => Writer<O, T2>): Writer<O, T2> {
    return this.map(f).flatten()
  }

  run(): [T, O[]] {
    return [this.value, this.output]
  }
}
