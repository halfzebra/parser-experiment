// TODO:
// [x] Trace constructor injection so I could reuse code for take in skip
//   [ ] Trace to contain start and end locations
// [ ] simple stdout error trace renderer (parsimmon or babel-like error formatter)
//   [ ] error message without a trace
//   [ ] trace
// [x] skip
// [ ] UI
//   [ ] Plan the work on the UI
//   [ ] Setup a parcel project in this repo
// [ ] regex parser
// [ ] chain
// [ ] error mapper
// [ ] alt

interface State {
  take: boolean;
  input: string;
  index: number;
  rest: string;
  result?: any;
  trace?: any;
  success?: boolean;
}

function initialState(input: string): State {
  return {
    take: true,
    input,
    index: 0,
    rest: input,
    result: null,
    trace: null,
  };
}

interface Trace {
  take: boolean;
  kind: 'string';
  pattern: string;
}

function stringTraceConstructor(pattern: string, take: boolean): Trace {
  return {
    take,
    kind: 'string',
    pattern,
  };
}

function location(currentState, previousState) {
  return { from: previousState.index, to: currentState.index };
}

function makeStringTrace(pattern) {
  return function stringTrace(currentState, previousState) {
    return stringTraceConstructor(pattern, currentState.take);
  };
}

function seqTrace({ trace }) {
  return {
    take: true,
    kind: 'seq',
    trace,
  };
}

function altTrace({ trace }) {
  return {
    take: true,
    kind: 'alt',
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

interface WrappedParser {
  parser: (state: State) => State;
  traceConstructor: (currentState: State, previousState: State) => Trace;
}

class Wrap {
  parser: (state: State) => State;
  traceConstructor: (currentState: State, previousState: State) => Trace;
  constructor(parser, traceConstructor) {
    this.parser = parser;
    this.traceConstructor = traceConstructor;
  }

  apply(currentState: State): State {
    const nextState = this.parser(currentState);
    return {
      ...nextState,
      trace: this.traceConstructor(nextState, currentState),
    };
  }

  map(fn) {
    return new Wrap((state: State) => {
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
  return new Wrap(makeStringParser(pattern), makeStringTrace(pattern));
}

function log(exp) {
  console.log(exp);
  return exp;
}

function pipe(...fns) {
  return arg => fns.reduce((accRes, currFn) => currFn(accRes), arg);
}

const makeSkippingParser = ({ take, ...rest }: State): State => ({ take: false, ...rest });

function skip(pattern) {
  return new Wrap(
    pipe(makeStringParser(pattern), makeSkippingParser),
    makeStringTrace(pattern)
  );
}

function alt(...parsers) {
  return new Wrap(function alt(state) {
    let { length } = parsers;
    let result = null;
    let next = state;
    let trace = [];
    for (let i = 0; i < length; i++) {
      next = parsers[i].apply({ ...state, trace: null });
      trace.push(next.trace);
      if (next.success === true && next.take) {
        if (next.take) {
          result = next.result;
        }
        break;
      }
    }
    return {
      ...next,
      result,
      trace,
    };
  }, altTrace);
}

function seq(...parsers) {
  return new Wrap(function seq(state) {
    let { length } = parsers;
    let next = state;
    let result = [];
    let trace = [];
    for (let i = 0; i < length; i++) {
      next = parsers[i].apply({ ...next, trace: null });
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

function run(parser, input: string) {
  return parser.apply(initialState(input));
}

export {
  take,
  skip,
  run,
  stringTraceConstructor,
  seqTrace,
  seq,
  Wrap,
  mapTrace,
  alt,
  altTrace,
};
