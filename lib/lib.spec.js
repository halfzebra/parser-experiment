const {
  take,
  initialState,
  stringTrace,
  seq,
  seqTrace,
  mapTrace,
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

  describe('map', () => {
    it('should map the result using a function', () => {
      expect(
        take('hello')
          .map(x => x.toUpperCase())
          .apply(initialState('hello'))
      ).toStrictEqual({
        index: 5,
        rest: '',
        result: 'HELLO',
        success: true,
        trace: mapTrace(stringTrace('hello')),
      });
    });

    it('should return the failed state of the previous parser', () => {
      expect(
        take('hello')
          .map(x => x.toUpperCase())
          .apply(initialState('bye'))
      ).toStrictEqual({
        index: 0,
        rest: 'bye',
        result: null,
        success: false,
        trace: stringTrace('hello'),
      });
    });

    it('should not call the fn if previous parser have failed', () => {
      const fn = jest.fn(x => x);
      take('hello')
        .map(fn)
        .apply(initialState('bye'));
      expect(fn).not.toHaveBeenCalled();
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
