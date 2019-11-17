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

export interface State {
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

function stringTraceConstructor(pattern: string, take: boolean) {
  return {
    take,
    kind: 'string',
    pattern,
  };
}

interface Location {
  from: number;
  to: number;
}

function location(currentState: State, previousState: State): Location {
  return { from: previousState.index, to: currentState.index };
}

function makeStringTrace(pattern: string) {
  return function stringTrace(currentState: State, previousState: State) {
    return stringTraceConstructor(pattern, currentState.take);
  };
}

function seqTrace({ trace }: State) {
  return {
    take: true,
    kind: 'seq',
    trace,
  };
}

function altTrace({ trace }: State) {
  return {
    take: true,
    kind: 'alt',
    trace,
  };
}

function mapTrace({ take, trace, success }: State) {
  // If previous parser fails, fn is not getting applied.
  if (success) {
    return {
      take,
      kind: 'map',
      trace,
    };
  }
  return trace;
}

class Wrap {
  parser: Parser;
  traceConstructor: (currentState: State, previousState: State) => any;
  constructor(
    parser: (state: State) => State,
    traceConstructor: (currentState: State, previousState: State) => any
  ) {
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

  map<A, B>(fn: (a: A) => B) {
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

function makeStringParser(pattern: string): Parser {
  return function string(state: State) {
    const result = pattern;
    const { input } = state;
    if (state.rest.startsWith(pattern)) {
      return {
        take: true,
        index: state.index + pattern.length,
        rest: state.rest.slice(pattern.length),
        success: true,
        result,
        input,
      };
    } else {
      return {
        take: true,
        index: state.index,
        rest: state.rest,
        success: false,
        result: null,
        input,
      };
    }
  };
}

function take(pattern: string) {
  return new Wrap(makeStringParser(pattern), makeStringTrace(pattern));
}

function log<T>(exp: T): T {
  console.log(exp);
  return exp;
}

type Parser = (state: State) => State;

function pipe(...fns: any): any {
  return (arg: any) => fns.reduce((accRes: any, currFn: any) => currFn(accRes), arg);
}

const makeSkippingParser = ({ take, ...rest }: State): State => ({
  take: false,
  ...rest,
});

function skip(pattern: string) {
  return new Wrap(
    pipe(makeStringParser(pattern), makeSkippingParser),
    makeStringTrace(pattern)
  );
}

function alt(...parsers: Wrap[]) {
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

function seq(...parsers: Wrap[]) {
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

function run(parser: Wrap, input: string) {
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
