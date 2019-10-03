const { take } = require('./take');

describe('take', () => {
  it('should parse the thing', () => {
    const state = {
      string: 'hello',
      rest: 'hello',
      index: 0,
      result: null
    };
    expect(take('hello')(state)).toStrictEqual({
      index: 5,
      rest: '',
      result: 'hello',
      string: 'hello'
    });
  });
});
