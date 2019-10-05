const {
  take,
  initialState,
  stringTrace,
  seq,
  seqTrace,
  Wrap,
} = require('./index');

describe('take', () => {
  it('returns a state containing matching string as a result', () => {
    expect(take('hello').apply(initialState('hello'))).toStrictEqual({
      index: 5,
      rest: '',
      result: 'hello',
      success: true,
      trace: stringTrace('hello'),
    });
  });

  it('should return a failed state if parser did not match', () => {
    expect(take('hello').apply(initialState('bye'))).toStrictEqual({
      index: 0,
      rest: 'bye',
      result: null,
      success: false,
      trace: stringTrace('hello'),
    });
  });
});

describe('seq', () => {
  it('should emit the result of a sequence as an array', () => {
    expect(seq(take('a'), take('b')).apply(initialState('ab'))).toStrictEqual({
      index: 2,
      rest: '',
      result: ['a', 'b'],
      success: true,
      trace: seqTrace([stringTrace('a'), stringTrace('b')]),
    });
  });

  it('should emit the trace of a sequence as an array of traces', () => {
    expect(seq(take('a'), take('b')).apply(initialState('ac'))).toStrictEqual({
      index: 1,
      rest: 'c',
      result: ['a'],
      success: false,
      trace: seqTrace([stringTrace('a'), stringTrace('b')]),
    });
  });
});
