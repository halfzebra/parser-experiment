const { match, parse } = require('./index')

describe('parse', () => {
  it('should parse the thing', () => {
    const state = {
      string: 'hello',
      rest: 'hello',
      index: 0,
      result: null
    }
    expect(match('hello')(state)).toStrictEqual({
      index: 5,
      rest: '',
      result: 'hello',
      string: 'hello'
    })
  })
})


seq(
  match('let'),
  skip(/\s/),
  match(/[a-z]+/)
)

seq
alt
  match
    map
    chain
  skip

