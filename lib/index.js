// TODO:
// - skip
// - chain
// - regex parser
//   https://github.com/jneen/parsimmon/blob/74a6345c9a0f3fce733b5712547b9dd3d0680f6f/src/parsimmon.js#L430

const initialState = string => ({
  string,
  index: 0,
  rest: string,
  result: null,
  trace: null,
});

const stringTrace = pattern => ({
  kind: 'take',
  matches: 'string',
  pattern,
});

const seqTrace = trace => ({
  kind: 'seq',
  trace,
});

const mapTrace = trace => ({
  kind: 'map',
  trace,
});

class Wrap {
  constructor(parser, trace) {
    this.parser = parser;
    this.trace = trace;
  }

  apply(state) {
    const next = this.parser(state);
    return { ...next, trace: this.trace(next.trace) };
  }

  map(fn) {
    return new Wrap(state => {
      const next = this.apply(state);

      if (next.success === false) {
        return next;
      }
      return {
        ...next,
        result: fn(next.result),
      };
    }, mapTrace);
  }
}

// function skip(pattern) {
//   return take(pattern);
// }

function take(pattern) {
  return new Wrap(
    function string(state) {
      const result = pattern;
      if (state.rest.startsWith(pattern)) {
        return {
          index: state.index + pattern.length,
          rest: state.rest.slice(pattern.length),
          success: true,
          result,
        };
      } else {
        return {
          index: state.index,
          rest: state.rest,
          success: false,
          result: null,
        };
      }
    },
    () => stringTrace(pattern)
  );
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
      trace,
    };
  }, seqTrace);
}

function parse(parser, input) {
  return parser.apply(initialState(input));
}

module.exports = {
  take,
  parse,
  initialState,
  stringTrace,
  seqTrace,
  seq,
  Wrap,
  mapTrace,
};
