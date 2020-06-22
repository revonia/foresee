import Foresee from '../Foresee'

test('Foresee should work with next call', async () => {
  const foresee = new Foresee((next, complete) => {
    next(1)
    next(2)
    next(3)
    setTimeout(() => {
      next(5)
      complete()
    }, 100)

    next(4)
  })

  const result = []
  for await (const v of foresee) {
    result.push(v)
  }

  expect(result).toStrictEqual([1, 2, 3, 4, 5])
})

test('Foresee should work with throw', async () => {
  const foresee = new Foresee((next, _, throws) => {
    next(1)
    throws(new Error('myError'))
  })

  try {
    for await (const v of foresee) {
      expect(v).toBe(1)
    }
  } catch (e) {
    expect(e.message).toBe('myError')
  }
})
