// https://github.com/jneen/parsimmon/blob/74a6345c9a0f3fce733b5712547b9dd3d0680f6f/src/parsimmon.js#L430

const initialState = string => ({
  string,
  index: 0,
  rest: string,
  result: null,
  trace: null,
});

const stringTrace = pattern => ({
  kind: 'take',
  matches: 'String',
  pattern,
});

const seqTrace = traces => ({
  kind: 'seq',
  matches: traces,
});

const mapTrace = trace => ({
  kind: 'map',
  matches: traces,
});

class Wrap {
  constructor(parser) {
    this.parser = parser;
  }

  apply(state) {
    return this.parser(state);
  }

  map(fn) {
    return new Wrap(state => {
      const next = this.apply(state);
      return {
        ...next,
        result: fn(next.result),
        trace: mapTrace(result.trace),
      };
    });
  }
}

function take(pattern) {
  return new Wrap(function string(state) {
    const result = pattern;
    if (state.rest.startsWith(pattern)) {
      return {
        trace: stringTrace(pattern, result),
        index: state.index + pattern.length,
        rest: state.rest.slice(pattern.length),
        success: true,
        result,
      };
    } else {
      return {
        trace: stringTrace(pattern, result),
        index: state.index,
        rest: state.rest,
        success: false,
        result: null,
      };
    }
  });
}

function seq(...wrappedParsers) {
  return new Wrap(function seq(state) {
    let { length } = wrappedParsers;
    let next = state;
    let result = [];
    let trace = [];
    for (let i = 0; i < length; i++) {
      next = wrappedParsers[i].apply({ ...next, trace: null });
      trace.push(next.trace);
      if (next.success === false) {
        break;
      }
      result.push(next.result);
    }
    return {
      ...next,
      result,
      trace: seqTrace(trace),
    };
  });
}

module.exports = { take, initialState, stringTrace, seqTrace, seq, Wrap };
