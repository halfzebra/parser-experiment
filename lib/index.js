function match(pattern) {
  return function(state) {
    if (state.string.startsWith(pattern)) {
      return {
        string: state.string,
        index: state.index + pattern.length,
        result: pattern,
        rest: state.string.slice(pattern.length)
      }
    } else {
      return {
        string: state.string,
        index: state.index,
        rest: state.rest,
        error: 'Bioohoo'
      }
    }
  }
}

function parse(parser, string) {
  const state = {
    index: 0,
    string,
    rest: string,
    result: null
  }
}

module.exports = { match, parse }
