class Defer<T> {
  readonly _promise: Promise<T>
  protected _resolve: (value?: T) => void

  constructor() {
    this._promise = new Promise((resolve) => {
      this._resolve = resolve
    })
  }
  static create<T>() {
    return new Defer<T>()
  }
  resolve(...args) {
    this._resolve(...args)
  }
  then<S>(f: (t: T) => S): Promise<S> {
    return this._promise.then(f)
  }
  catch(...args) {
    return this._promise.catch(...args)
  }
}

export default Defer.create
