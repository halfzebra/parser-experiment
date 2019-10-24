const {
  take,
  skip,
  stringTraceConstructor,
  seq,
  seqTrace,
  mapTrace,
  run,
} = require('./index');

describe('take', () => {
  it('returns a state containing matching string as a result', () => {
    expect(run(take('hello'), 'hello')).toStrictEqual({
      index: 5,
      rest: '',
      result: 'hello',
      success: true,
      take: true,
      trace: stringTraceConstructor('hello', true),
    });
  });

  it('should return a failed state if parser did not match', () => {
    expect(run(take('hello'), 'bye')).toStrictEqual({
      index: 0,
      rest: 'bye',
      result: null,
      success: false,
      take: true,
      trace: stringTraceConstructor('hello', true),
    });
  });

  describe('map', () => {
    it('maps the result using a function', () => {
      expect(
        run(take('hello').map(x => x.toUpperCase()), 'hello')
      ).toStrictEqual({
        index: 5,
        rest: '',
        result: 'HELLO',
        success: true,
        take: true,
        trace: mapTrace({
          trace: stringTraceConstructor('hello', true),
          success: true,
        }),
      });
    });

    it('returns the failed state of the previous parser', () => {
      expect(run(take('hello').map(x => x.toUpperCase()), 'bye')).toStrictEqual(
        {
          index: 0,
          rest: 'bye',
          result: null,
          success: false,
          take: true,
          trace: stringTraceConstructor('hello', true),
        }
      );
    });

    it('does not call the fn if previous parser have failed', () => {
      const fn = jest.fn(x => x);
      run(take('hello').map(fn), 'bye');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('stringTraceConstructor', () => {
    it('produces a trace that takes a string', () => {
      expect(stringTraceConstructor('hello', true)).toStrictEqual({
        kind: 'string',
        pattern: 'hello',
        take: true,
      });
    });
  });
});

describe('seq', () => {
  it('emits the result of a sequence as an array', () => {
    expect(run(seq(take('a'), take('b')), 'ab')).toStrictEqual({
      index: 2,
      rest: '',
      take: true,
      result: ['a', 'b'],
      success: true,
      trace: seqTrace({
        trace: [
          stringTraceConstructor('a', true),
          stringTraceConstructor('b', true),
        ],
      }),
    });
  });

  it('emits the trace of a sequence as an array of traces', () => {
    expect(run(seq(take('a'), take('b')), 'ac')).toStrictEqual({
      take: true,
      index: 1,
      rest: 'c',
      result: ['a'],
      success: false,
      trace: seqTrace({
        trace: [
          stringTraceConstructor('a', true),
          stringTraceConstructor('b', true),
        ],
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

describe('skip', () => {
  it('skips the matched string', () => {
    expect(run(skip('hello'), 'hello')).toStrictEqual({
      index: 5,
      rest: '',
      result: 'hello',
      success: true,
      take: false,
      trace: stringTraceConstructor('hello', false),
    });
  });

  describe('map', () => {
    it('map fn is not getting called', () => {
      const fn = jest.fn(x => x);
      run(skip('hello').map(fn), 'hello');
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
