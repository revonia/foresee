import Foresee from '../Foresee'

export default function merge<T>(foresees: Foresee<T>[]) {
  return new Foresee<T>((next, complete, throws) => {
    let hasError = false
    foresees.forEach(async (foresee) => {
      try {
        for await (const value of foresee) {
          if (hasError) break;
          next(value)
        }
      } catch (e) {
        throws(e)
        hasError = true
      }
    })

    return () => {
      foresees.forEach((foresee) => {
        foresee.dispose()
      })
    }
  })
}
