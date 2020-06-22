type DisposeFn = () => void
type NextFn<T> = (value?: T) => void
type CompleteFn<R> = (ret?: R) => void
type Reject = (err?: any) => void
type Executor<T, R> = (next: NextFn<T>, complete: CompleteFn<R>, throws: Reject) => void | DisposeFn
type Resolve<T> = (nextValue: NextValue<T>) => void
type Exec<T> = (resolve: Resolve<T>, reject: (err: any) => void) => void

interface NextValue<T> {
  value: T
  done: boolean
}

export default class Foresee<T = any, R = any> {
  private toDispose: DisposeFn | null = null

  private done = false
  private started = false
  private queue: Exec<T | R>[] = []
  private current: {
    resolve: Resolve<T | R>,
    reject: Reject,
  } = null

  constructor(private executor: Executor<T, R>) {
  }

  private pushQueue(value: T | R, done: boolean, rejected?: boolean, error?: any) {
    const exec: Exec<T | R> = (resolve, reject) => {
      if (!this.done) {
        if (done || rejected) {
          this.done = true
          this.executor = null
          this.queue = []
        }
        if (rejected) {
          reject(error)
        } else {
          resolve({ value, done })
        }
      }
    }

    if (this.current) {
      const current = this.current
      this.current = null
      exec(current.resolve, current.reject)
    } else {
      this.queue.push(exec)
    }
  }

  private nextCb = (value: T) => {
    if (!this.done) {
      this.pushQueue(value, false)
    }
  }

  private completeCb = (ret?: R) => {
    if (!this.done) {
      this.pushQueue(ret, true)
    }
  }

  private invoke = (resolve: Resolve<T | R>, reject: Reject) => {
    if (this.queue.length) {
      this.queue.shift()(resolve, reject)
    } else {
      this.current = {
        resolve,
        reject
      }
    }
  }

  private throwCb = (err: any) => {
    if (!this.done) {
      this.pushQueue(null, false, true, err)
    }
  }

  public dispose() {
    if (typeof this.toDispose === 'function') {
      this.toDispose()
    }
  }

  public next() {
    if (!this.started) {
      const cancel = this.executor(this.nextCb, this.completeCb, this.throwCb)
      if (cancel) {
        this.toDispose = cancel
      }
      this.started = true
    }

    return new Promise<NextValue<T | R>>(this.invoke)
  }

  public throw(err?: any) {
    return this.throwCb(err)
  }

  public return(ret?: R) {
    return this.completeCb(ret)
  }

  public [Symbol.asyncIterator]() {
    return this
  }
}
