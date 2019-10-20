# Notes

## Goals

Provide a [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator) library with a minimal and intuitive API surface and user-friendly error-handling.

Include a built-in implementation of Pratt algorithm.

## API design

This is how the usage might look like:

```js
const keyword = seq(
  skip(/\s+/),
  take('let'),
  skip(/\s+/),
)
```

The top-level API should include the following constructors:

- Combinators
  - `seq` for sequences of parsers
  - `alt` for optional match on a list of parsers
- Parsers
  - `skip` for matching and skipping the string
  - `take` for matching a string and emitting a result
- Helpers
  - `map` for transforming the results emitted by parsers
  - `chain` for conditional parsing dependent on the result from previous parser
  - `mapError` for transforming the error emitted by a parser
- Constructors
  - `fail`
  - `success`
- Lookahead (?)

`map` and `chain` can be represented by a generic `then`, which mirrors a similar API in Promises.

`catch` would replace `mapError`, but in Promises `catch` enables a recovery from error state, so maybe this is not the best option.

### Parsers

I was a bit uncertain about the parser implementation, but it seems like it's worth to support edge-cases like skipping sequence.

Therefore `take` and `skip` are not the parsers, but rather parser creators, which make parsers, that emit the value or succeed silently.

Instead of those there should be:

- `string` parser produced by `take('hello')`
- `regex` parser produced by `take(/[a-z]/)`
- `fn` parser, which is an advanced use-case for creating new parsers.

### Idea: String literal-based DSL

Is there value in exploring something like this?

```js
seq`
  + let
  - \s
`
```

### Idea: Functional API vs OO API

Functional API needs `pipe` helper for composition:

```js
parse(
  pipe(
    seq(
      take(/[a-z]+/),
      skip(/\s+/),
      pipe(
        take(/\d+/),
        map(Number.parseInt)
      )
    ),
    map(([name, age]) => ({ name, age }))
  )
)('Ed 29')
```

Object-Oriented API provides seemingly better readability:

```js
parse(
  seq(
    take(/[a-z]+/),
    skip(/\s+/),
    take(/\d+/).map(Number.parseInt)
  ).map(([name, age]) => ({ name, age })),
  'Ed 29'
)
```

### Idea: Functional API without `pipe` with variadic functions

What if the API allows passing extra arguments to all parsers?

```js
parse(
  seq([
      take(/[a-z]+/),
      skip(/\s+/),
      take(/\d+/, Number.parseInt)
    ],
    ([name, age]) => ({ name, age })
  ),
  'Ed 29'
)
```

This is okay for replacing `.chain` and `.map`, but how to allow modifying errors?

### Idea: Error Tracing

It seems like it will be useful to track the parsers path to produce a meaningful error on failure.

This would require generating a tree of parser history.

*Update:* Error tracing turned out an interesting idea to work on, so I've implemented the support for it. Now I'll look into a way to support the visualisation of it.

## Links

- [sufianrhazi/parsinator](https://github.com/sufianrhazi/parsinator) has an interesting example of using a generator for creating parsers.
- [jneen/parsimmon](https://github.com/jneen/parsimmon) is probably the best existing library with parsers.
