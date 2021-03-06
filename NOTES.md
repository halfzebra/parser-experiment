# Notes

<!-- toc -->

- [Goals](#goals)
- [API design](#api-design)
  * [Parsers](#parsers)
  * [Parser creators `take` and `skip`](#parser-creators-take-and-skip)
  * [Regexp parser](#regexp-parser)
- [Ideas](#ideas)
  * [String literal-based DSL](#string-literal-based-dsl)
  * [Functional API vs OO API](#functional-api-vs-oo-api)
  * [Functional API without `pipe` with variadic functions](#functional-api-without-pipe-with-variadic-functions)
  * [Error Tracing](#error-tracing)
  * [UI](#ui)
    + [CodeMirror](#codemirror)
  * [AST Traversal](#ast-traversal)
- [Links](#links)

<!-- tocstop -->

## Goals

Provide a [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator) library with a minimal and intuitive API surface and the user-friendly errors for the best educational experience for learning the basics of AST parsing.

Include a built-in implementation of [Pratt parser](https://en.wikipedia.org/wiki/Pratt_parser).

This library is not attempting to:

- Implement a parser with the best possible performance
- Create an adaptaion of [parsec](http://hackage.haskell.org/package/parsec) in JavaScript
- Implement the [fantasyland](https://github.com/fantasyland/fantasy-land) spec

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
- Built-in Pratt Parser

`map` and `chain` can be represented by a generic `then`, which mirrors a similar API in Promises.

`catch` would replace `mapError`, but in Promises `catch` enables a recovery from error state, so maybe this is not the best option.

### Parsers

I was a bit uncertain about the parser implementation, but it seems like it's worth to support edge-cases like skipping sequence.

Therefore `take` and `skip` are not the parsers, but rather parser creators, which make parsers, that emit the value or succeed silently.

Instead of those there should be:

- `string` parser produced by `take('hello')`
- `regex` parser produced by `take(/[a-z]/)`
- `fn` parser, which is an advanced use-case for creating new parsers.

### Parser creators `take` and `skip`

Both creators should allow working with RegExp and String.

This will require a set of helpers to enable the creator to check inputs. 

```js
function isRegExp(exp) {
  return exp instanceof RegExp;
}

function isString(exp) {
  return typeof exp === 'string'
}

function isStringEmpty(str) {
  return str.length !== 0;
}
```

RegExp needs to be converted to the one that matches the beginning of the string. Parsimmon has a helpful concept for this called [Anchored RegExp](https://github.com/jneen/parsimmon/blob/74a6345c9a0f3fce733b5712547b9dd3d0680f6f/src/parsimmon.js#L669).


### Regexp parser

There are a few acceptance criterias for this parser that I want to have:

- Should not require line start token `^`
- Should allow only limited amount of flags(see [parsimmon](https://github.com/jneen/parsimmon/blob/74a6345c9a0f3fce733b5712547b9dd3d0680f6f/src/parsimmon.js#L433) for details)

```js
take(/[a-z]/)
```

## Ideas

### String literal-based DSL

Is there value in exploring something like this?

```js
seq`
  + let
  - \s
`
```

### Functional API vs OO API

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

### Functional API without `pipe` with variadic functions

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

### Error Tracing

It seems like it will be useful to track the parsers path to produce a meaningful error on failure.

This would require generating a tree of parser history.

*Update:* Error tracing turned out an interesting idea to work on, so I've implemented the support for it. Now I'll look into a way to support the visualisation of it.

### UI

The goal of this project is to provide the maximum transparency on what parser matches every specific part of a string.

The simple UI might function in a similar way to [regex101.com](https://regex101.com).

[CodeMirror](https://github.com/codemirror/CodeMirror) might be a good suit for the task.

[Prism.js](https://prismjs.com/) does not look liek a viable choice due to the lack of the API for manipulating the DOM of the editor.

Playground examples:

- [sap/chevrotain](https://github.com/sap/chevrotain) Parser Building Toolkit for JavaScript with an amazing interactive [playground](https://sap.github.io/chevrotain/).
- [pegjs](https://pegjs.org/) another parser library with interactive playground.

#### CodeMirror

After looking into CodeMirror capabilities, I've found the APIs for manipulating code hightlightning.

CodeMirror Reference:
https://codemirror.net/doc/manual.html

```js
// cm.addOverlay
// cm.addWidget

editor.addOverlay({
  token(stream) {
    console.log(stream)
    stream.skipToEnd();
  }
})

// doc.markText
// doc.addLineClass
// doc.addLineWidget

const doc = editor.getDoc()

doc.markText(
  { line: 0, ch: 1 },
  { line: 0, ch: 10 },
  {
    className: 'booho'
  }
)
```

### AST Traversal

[substack/js-traverse](https://github.com/substack/js-traverse) could be a great help in traversing and updating the AST tree after parsing.

It would be helpful to include an example of a simple compiler using it.

## Links

- [jneen/parsimmon](https://github.com/jneen/parsimmon) is probably the best JavaScript library with parsers.
- [sufianrhazi/parsinator](https://github.com/sufianrhazi/parsinator) has an interesting example of using a generator for creating parsers.
- [elm/parser](https://github.com/elm/parser) one of the best APIs for parsers written in Elm.
- [dmy/elm-pratt-parser](https://github.com/dmy/elm-pratt-parser) Pratt Parser implementation.
