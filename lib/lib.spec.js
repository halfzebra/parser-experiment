const {
  take,
  initialState,
  stringTraceConstructor,
  seq,
  seqTrace,
  mapTrace,
  parse,
} = require('./index');

describe('take', () => {
  it('returns a state containing matching string as a result', () => {
    expect(parse(take('hello'), 'hello')).toStrictEqual({
      index: 5,
      rest: '',
      result: 'hello',
      success: true,
      take: true,
      trace: stringTraceConstructor('hello'),
    });
  });

  it('should return a failed state if parser did not match', () => {
    expect(parse(take('hello'), 'bye')).toStrictEqual({
      index: 0,
      rest: 'bye',
      result: null,
      success: false,
      take: true,
      trace: stringTraceConstructor('hello'),
    });
  });

  describe('map', () => {
    it('maps the result using a function', () => {
      expect(
        take('hello')
          .map(x => x.toUpperCase())
          .apply(initialState('hello'))
      ).toStrictEqual({
        index: 5,
        rest: '',
        result: 'HELLO',
        success: true,
        take: true,
        trace: mapTrace({
          trace: stringTraceConstructor('hello'),
          success: true,
        }),
      });
    });

    it('returns the failed state of the previous parser', () => {
      expect(
        parse(take('hello').map(x => x.toUpperCase()), 'bye')
      ).toStrictEqual({
        index: 0,
        rest: 'bye',
        result: null,
        success: false,
        take: true,
        trace: stringTraceConstructor('hello'),
      });
    });

    it('does not call the fn if previous parser have failed', () => {
      const fn = jest.fn(x => x);
      parse(take('hello').map(fn), 'bye');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('stringTraceConstructor', () => {
    it('produces a trace that takes a string', () => {
      expect(stringTraceConstructor('hello')).toStrictEqual({
        kind: 'string',
        pattern: 'hello',
        take: true,
      });
    });
  });
});

describe('seq', () => {
  it('emits the result of a sequence as an array', () => {
    expect(parse(seq(take('a'), take('b')), 'ab')).toStrictEqual({
      index: 2,
      rest: '',
      take: true,
      result: ['a', 'b'],
      success: true,
      trace: seqTrace({
        trace: [stringTraceConstructor('a'), stringTraceConstructor('b')],
      }),
    });
  });

  it('emits the trace of a sequence as an array of traces', () => {
    expect(parse(seq(take('a'), take('b')), 'ac')).toStrictEqual({
      take: true,
      index: 1,
      rest: 'c',
      result: ['a'],
      success: false,
      trace: seqTrace({
        trace: [stringTraceConstructor('a'), stringTraceConstructor('b')],
      }),
    });
  });

  describe('seqTrace', () => {
    it('produces a trace for a sequence', () => {
      expect(seqTrace({ trace: null })).toStrictEqual({
        kind: 'seq',
        trace: null,
        take: true,
      });
    });
  });
});
