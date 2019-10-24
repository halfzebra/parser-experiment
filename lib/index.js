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
    take: true,
    string,
    index: 0,
    rest: string,
    result: null,
    trace: null,
  };
}

function stringTraceConstructor(pattern, take) {
  return {
    take,
    kind: 'string',
    pattern,
  };
}

function makeStringTrace(pattern) {
  return function stringTrace({ take }) {
    return stringTraceConstructor(pattern, take);
  };
}

function seqTrace({ trace }) {
  return {
    take: true,
    kind: 'seq',
    trace,
  };
}

function mapTrace({ trace, success }) {
  // If previous parser fails, fn is not getting applied.
  if (success) {
    return {
      kind: 'map',
      trace,
    };
  }
  return trace;
}

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

      if (next.success === false || next.take === false) {
        return next;
      }
      return {
        ...next,
        result: fn(next.result),
      };
    }, mapTrace);
  }
}

function makeStringParser(pattern) {
  return function string(state) {
    const result = pattern;
    if (state.rest.startsWith(pattern)) {
      return {
        take: true,
        index: state.index + pattern.length,
        rest: state.rest.slice(pattern.length),
        success: true,
        result,
      };
    } else {
      return {
        take: true,
        index: state.index,
        rest: state.rest,
        success: false,
        result: null,
      };
    }
  };
}

function wrapTraceConstructor(kind, traceConstructor) {
  return function take(...args) {
    return {
      kind,
      ...traceConstructor(...args),
    };
  };
}

function take(pattern) {
  return new Wrap(makeStringParser(pattern, true), makeStringTrace(pattern));
}

function log(exp) {
  console.log(exp);
  return exp;
}

function pipe(...fns) {
  return arg => fns.reduce((accRes, currFn) => currFn(accRes), arg);
}

const makeSkippingParser = ({ take, ...rest }) => ({ take: false, ...rest });

function skip(pattern) {
  return new Wrap(
    pipe(
      makeStringParser(pattern),
      makeSkippingParser
    ),
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

      // Return the result, only if's returned by a taking parser.
      if (next.take) {
        result.push(next.result);
      }
    }
    return {
      ...next,
      result,
      trace,
    };
  }, seqTrace);
}

function run(parser, input) {
  return parser.apply(initialState(input));
}

module.exports = {
  take,
  skip,
  run,
  stringTraceConstructor,
  seqTrace,
  seq,
  Wrap,
  mapTrace,
};
