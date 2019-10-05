const { take, initialState, stringTrace, seq } = require('./index');

describe('take', () => {
  it('should return a result containing matching string', () => {
    expect(take('hello')(initialState('hello'))).toStrictEqual({
      trace: stringTrace('hello'),
      result: 'hello',
      index: 5,
      success: true,
      rest: '',
    });
  });

  it('should return a failed state if parser did not match', () => {
    expect(take('hello')(initialState('bye'))).toMatchObject({
      success: false,
      index: 0,
      result: null
    });
  });
});

describe('seq', () => {
  it('should emit the result of a sequence as an array', () => {
    expect(seq(take('a'), take('b'))(initialState('ab'))).toMatchObject({
      result: ['a', 'b'],
    });
  });

  it('should emit the trace of a sequence as an array of traces', () => {
    expect(seq(take('a'), take('b'))(initialState('ab'))).toMatchObject({
      trace: [stringTrace('a'), stringTrace('b')],
    });
  });
});
