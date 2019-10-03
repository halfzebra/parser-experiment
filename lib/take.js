function take(pattern) {
  return function(state) {
    if (state.string.startsWith(pattern)) {
      return {
        index: state.index + pattern.length,
        result: pattern,
        rest: state.rest.slice(pattern.length)
      }
    } else {
      // return {
      //   string: state.string,
      //   index: state.index,
      //   rest: state.rest,
      //   error: 'Bioohoo'
      // }
    }
  }
}

module.exports = { take, parse }
