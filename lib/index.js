// TODO:
// 1. Trace constructor injection so I could reuse code for take in skip
//    This would enable
// 2. skip
// 3. chain
// 4. simple stdout error trace renderer
// 5  parsimmon or babel-like error formatter
// 6. UI?
// 7. regex parser
//    https://github.com/jneen/parsimmon/blob/74a6345c9a0f3fce733b5712547b9dd3d0680f6f/src/parsimmon.js#L430

function initialState(string) {
  return {
    string,
    index: 0,
    rest: string,
    result: null,
    trace: null,
  };
};

function stringTraceConstructor(pattern) {
  return {
    kind: 'take',
    matches: 'string',
    pattern,
  };
};

function makeStringTrace(pattern) {
  return function stringTrace() {
    return stringTraceConstructor(pattern);
  }
}

function seqTrace({ trace }) {
  return {
    kind: 'seq',
    trace,
  };
};

function mapTrace({ trace, success }) {
  // If previous parser fails, fn is not getting applied.
  if (success) {
    return {
      kind: 'map',
      trace,
    };
  }
  return trace;
};

class Wrap {
  constructor(parser, traceConstructor) {
    this.parser = parser;
    this.traceConstructor = traceConstructor;
  }

  apply(state) {
    const next = this.parser(state);
    return { ...next, trace: this.traceConstructor(next) };
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
    makeStringTrace(pattern)
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
  stringTraceConstructor,
  seqTrace,
  seq,
  Wrap,
  mapTrace,
};
