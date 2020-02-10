:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# Writing your own operator <!-- omit in toc -->

- [Overview](#overview)
- [Creation operators](#creation-operators)
  - [Examples](#examples)
- [General operators](#general-operators)
  - [Filtering](#filtering)
    - [Examples](#examples-1)
  - [Transforming](#transforming)
    - [Examples](#examples-2)
  - [Side effects](#side-effects)
    - [Examples](#examples-3)
- [Best practices](#best-practices)
- [Advanced](#advanced)
  - [Understanding `value`, `params`](#understanding-value-params)
  - [`params` are optional and always available](#params-are-optional-and-always-available)
  - [Streams run in separate processes](#streams-run-in-separate-processes)
  - [Environment variables](#environment-variables)

## Overview

Finch streams are sequences of operators. An operator:

- is conceptually a single purpose program.
- is unaware of its stream and other operators.
- embodies [Unix's pipe philosophy](https://homepage.cs.uri.edu/~thenry/resources/unix_art/ch01s06.html).

Operators are implemented as functions. They responsible for yielding their own interesting values or applying novel logic to a provided value then yielding another value to the stream. Values can be yielded synchronously or asynchronously.

The operator contract is:

- one operator is implemented per file
- the default export of the file is a function
- the function:
  - receives one argument:
    - an immutable object containing a `params` object and an optional `value`
  - returns one of:
    - a Promise which resolves with a single value or rejects with an error
    - a synchronous iterator which yields one or more values
    - an RxJS Observable which nexts one or more values then completes or errors

That's it. Simple is as simple does.

It may be helpful to conceptually separate operators that yield their own interesting values from operators that perform as task on a provided value. Operators that yield their own values can be thought of as _creation operators_. All other operators are _general operators_.

## Creation operators

These operators _create_ values to yield to the stream; they aren't influenced by a provided `value`. There is typically one creation operator per stream. A creation operator can exist at any point in a stream. It provides interesting values to the stream. The values can be defined ahead of time or determined over time. A stream should complete when the creation operator has yielded all of its values.

### Examples

<details>
  <summary>Yield one value synchronously</summary>

An operator that yields one value synchronously is the simplest and most flexible creation operator. Let's implement the `one-value-sync` operator defined below.

```yaml
---
# stream.yaml
- use: "./one-value-sync"
  params:
    message: "Hello World"
```

```
$ finch start ./stream.yaml
[cli/start] Hello World
[cli/start] 🐦 Done
```

Using a Promise:

```js
module.exports = ({ params }) => Promise.resolve(params.message);
```

Using async/await:

```js
module.exports = async ({ params }) => params.message;
```

Using a synchronous iterator:

```js
module.exports = function*({ params }) {
  yield params.message;
};
```

Using a RxJS Observable:

```js
const { of } = require("rxjs");

module.exports = ({ params }) => of(params.message);
```

</details>

<details>
  <summary>Yield one value asynchronously</summary>

Operator which yield a single value asynchronously are implemented using a Promise or Rx.Observable.

Let's implement the `one-value-async` operator defined below.

```yaml
---
# stream.yaml
- use: "./one-value-async"
  params:
    message: "Hello World"
    delay: 1000
```

```
$ finch start ./stream.yaml
[cli/start] Hello World
[cli/start] 🐦 Done
```

Using a Promise:

```js
module.exports = ({ params }) =>
  new Promise(resolve => {
    setTimeout(resolve.bind(null, params.message), params.delay);
  });
```

Using async/await:

```js
function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

module.exports = async ({ params }) => {
  await wait(params.delay);
  return params.message;
};
```

Using a RxJS Observable:

```js
const { of } = require("rxjs");
const { delay } = require("rxjs/operators");

module.exports = ({ params }) => of(params.message).pipe(delay(params.delay));
```

</details>

<details>
  <summary>Yield multiple values synchronously</summary>

An operator which yields multiple values synchronously must return a synchronous iterator or an Rx Observable. Promises are only capable of resolving or rejecting once.

Let's implement the `multiple-values-sync` operator defined below.

```yaml
---
# stream.yaml
- use: "./multiple-values-sync"
  params:
    values:
      - "That's one small step for a man,"
      - "one giant leap for mankind."
```

```
$ finch start ./stream.yaml
[cli/start] That's one small step for a man,
[cli/start] one giant leap for mankind.
[cli/start] 🐦 Done
```

Using a synchronous iterator:

```js
module.exports = function*({ params }) {
  for (const value of params.values) {
    yield value;
  }
};
```

Using a RxJS Observable:

```js
const { from } = require("rxjs");

module.exports = ({ params }) => from(params.values);
```

</details>

<details>
  <summary>Yield multiple values asynchronously</summary>

Operator which yield multiple values asyncronously (over time) are implemented using Rx Observables. Eventually asynchronous generators will be supported, see [mseeley/finch#236](https://github.com/mseeley/finch/issues/236).

Let's implement the `multiple-values-async` operator defined below. The implementation is intentionally unwound to make it clearer how the `observer` is directly managed.

```yaml
---
# stream.yaml
- use: "./multiple-values-async"
  params:
    values:
      - "That's one small step for a man,"
      - "one giant leap for mankind."
    delay: 1000
```

```
$ finch start ./stream.yaml
[cli/start] That's one small step for a man,
[cli/start] one giant leap for mankind.
[cli/start] 🐦 Done
```

```js
const { Observable } = require("rxjs");

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

module.exports = function({ params }) {
  return new Observable(async observer => {
    try {
      for (const value of params.values) {
        observer.next(value);
        await wait(params.delay);
      }
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  });
};
```

Notice how:

- the `observer` communicates errors and next values to the stream.
- the `observer` completes once its interesting values are exhausted. An `observer` is expected to `complete()` or `error()`.
- the body of the operator is wrapped in a `try...catch` and any errors are fed directly back to using the `observer`.

</details>

## General operators

Most operators are general, non-creation, operators. General operators perform logic on a `value` provided by an earlier operator. These operators broadly fall into a three different groups:

- Filtering
- Transforming
- Side effects

Filtering and transforming operators are pure programs. They always yield the same next values when called multiple times with the same initial value. These operators don't affect their environment.

Side effect operators make changes outside of their execution scope. Operators that make file system changes, log, download, etc are side effect operators.

Avoid writing operators which mix filtering, transforming, and side effects. A little mixing can be convenient but too much typically leads to an overspecialized operator with too much responsibility. Try to limit operators to as few responsibilities as possible. Remember, each operator should do only one thing and do it well.

### Filtering

A filter operator decides if a value should continue down stream by returning the `value` their provided or a special `EMPTY()` value exported by `@finch/core`. The `EMPTY()` value instructs Finch to prevent the value from propagating down stream. A filter operator can operate synchronously or asynchronously.

Any operator can act as a filter when it completes successfully yet has no value to yield to the next stage.

> :bird: Finch's [`regexp-accept`](../packages/regexp-accept/) and [`regexp-ignore`](../packages/regexp-ignore/) packages are filter operators.

#### Examples

<details>
  <summary>Implement a filter operator</summary>

Let's implement the `accept-even-numbers` operator defined below. If the `value` is even then it will be yielded by the operator. An odd `value` is prevented from traveling further down stream. Remember to implement specific operators that have defined behaviors when presented unexpected values.

```yaml
---
# stream.yaml
- use: "@finch/values"
  params:
    values:
      - 0
      - 1
      - 2
- use: "./accept-even-numbers"
```

```
$ finch start ./stream.yaml
[cli/start] 0
[cli/start] 2
[cli/start] 🐦 Done
```

```js
const { EMPTY } = require("@finch/core");

module.exports = function*({ value }) {
  if (isNaN(parseFloat(value))) {
    throw new TypeError(`${value} is not a number`);
  }

  yield value % 2 === 0 ? value : EMPTY();
};
```

> :bird: The operator was implemented using a generator function. It could have also be implemented using a Promise, async/await, or an Rx Observable.

</details>

### Transforming

A transform operator accept an initial value then yields one or more next values.

> :bird: Finch's [`regexp-split`](../packages/regexp-split/) and [`json-stringify`](../packages/json-stringify) are transform operators.

#### Examples

<details>
  <summary>Implement a transform operator</summary>

Let's implement the `parse-url` operator defined below.

```yaml
---
# stream.yaml
- use: "@finch/values"
  params:
    values:
      - "https://github.com/mseeley/finch/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement"
- use: "./parse-url"
```

```js
$ finch start ./stream.yaml
[cli/start] { hash: '',
  host: 'github.com',
  hostname: 'github.com',
  href:
   'https://github.com/mseeley/finch/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement',
  origin: 'https://github.com',
  password: '',
  pathname: '/mseeley/finch/issues',
  port: '',
  protocol: 'https:',
  search: '?q=is%3Aissue+is%3Aopen+label%3Aenhancement',
  searchParams: { q: 'is:issue is:open label:enhancement' },
  username: '' }
[cli/start] 🐦 Done
```

```js
module.exports = async function({ value }) {
  const url = new URL(value);
  const keys = [
    "hash",
    "host",
    "hostname",
    "href",
    "origin",
    "password",
    "pathname",
    "port",
    "protocol",
    "search",
    "searchParams",
    "username",
  ];

  return keys.reduce((acc, key) => {
    const urlValue = url[key];

    if (urlValue.entries) {
      acc[key] = {};

      for (const [k, v] of urlValue.entries()) {
        acc[key][k] = v;
      }
    } else {
      acc[key] = urlValue;
    }

    return acc;
  }, {});
};
```

</details>

### Side effects

Wikipedia does an excellent job plainly explaining side effects.

> In computer science, an operation, function or expression is said to have a side effect if it modifies some state variable value(s) outside its local environment, that is to say has an observable effect besides returning a value (the main effect) to the invoker of the operation. https://en.wikipedia.org/wiki/Side_effect_(computer_science)

A Finch stream has one or more side effect operators. They're typically the really interesting ones that perform the stream's outcome.

#### Examples

<details>
  <summary>Implement a download operator</summary>

Let's implement the `download-url` operator defined below. Finch will offer upload/download operators in the future, see [mseeley/finch#240](https://github.com/mseeley/finch/issues/240), [mseeley/finch#241](https://github.com/mseeley/finch/issues/241).

```yaml
---
# stream.yaml
- use: "@finch/values"
  params:
    values:
      - "https://en.wikipedia.org/wiki/Side_effect_(computer_science)"
- use: "./parse-url"
- use: "./download-url"
  params:
    destination: "/Users/mseeley/Downloads"
```

```js
[download-url-promise] Downloading https://en.wikipedia.org/wiki/Side_effect_(computer_science) to /Users/mseeley/Downloads/Side_effect_(computer_science)
[download-url-promise] Downloaded https://en.wikipedia.org/wiki/Side_effect_(computer_science)
[cli/start] /Users/mseeley/Downloads/Side_effect_(computer_science)
[cli/start] 🐦 Done
```

```js
const fs = require("fs");
const path = require("path");
const stream = require("stream");
// See: https://www.npmjs.com/package/download
const download = require("download");

const localName = `[${path.basename(__filename, ".js")}]`;

module.exports = function({ params, value }) {
  return new Promise((resolve, reject) => {
    const { href, pathname } = value;

    let destination = path.join(params.destination, path.basename(pathname));

    destination = path.normalize(destination);

    console.log(localName, "Downloading", href, "to", destination);

    stream.pipeline(download(href), fs.createWriteStream(destination), err => {
      if (err) {
        reject(err);
      } else {
        console.log(localName, "Downloaded", href);
        // The downloaded filename is passed to the next operator.
        resolve(destination);
      }
    });
  });
};
```

> :bird: Finch logging enhancements are tracked in [mseeley/finch#235](https://github.com/mseeley/finch/issues/235).

</details>

## Best practices

- When writing operators for other users to share, please:
  - Operators always remain backwards compatible.
  - Operators don't have breaking changes. Instead introduce a new operator, new parameter, or allow users to opt into new behavior manually through a parameter falg.
- Treat the return value of `EMPTY()` as an opaque value. Always call the function when returning its value; never cache it locally.
- Operators are typically [pure functions](https://en.wikipedia.org/wiki/Pure_function). Their implementations, by extension, should be stateless. Storing local state across multiple invocations of a stage is typically an antipattern; tread carefully. Keep your stages small and focused. Chain stages together to handle more complicated logic.

## Advanced

### Understanding `value`, `params`

Finch provides each operator with an _immutable object_ argument containing:

- `value` yielded from a previous operator
- `params` supplied to the operator's definition

The `value` object _is a clone_ of the `value` yielded by a previous operator. Enforcing cloning and immutability prevents an operator from contaminating with another operator or an operator changing its own `params`.

The `value` immutability is transparent when operators receive and transform scalar types such as strings, numbers, and booleans. Although when `value` is a reference type, typically an object or array, then the operator must yield a copy of `value`.

Below are some examples of working with an immutable `value`:

```js
const nextValue = { ...value };
// New properties can be added or existing ones changed.
nextValue.existingKey = 42;
```

```js
const nextValue = require("lodash.clonedeep")(value);
// New properties can be added to any object.
nextValue.anObject.key = 42;
```

```js
const nextValue = Array.from(value);
nextValue.push("my new value");
// Array members can be added or removed. Remember if the array contains objects
// then those objects will need to be cloned before they can be mutated.
return nextValue;
```

> :bird: Operators should always yield native JavaScript data types. Instances of custom classes or non data types such as functions are non-cloneable. All yielded values must be cloneable.

### `params` are optional and always available

Each operator receives an immutable `params` object containing the parameters provided to the operators definition. Finch ensures that the operator always receives a `params` object, even when the definition has no parameters.

### Streams run in separate processes

Each stream is run in a separate process. This is transparent except for the following situations:

- Each process has its own `require` cache. So, if you require the same file in multiple streams then the file is being required multiple times. You'll only run into problems if you're keeping stateful values outside of the operator's `function` export.
- Streams can be created programmatically using `createStream` exported by `@finch/core`. When creating streams this way be certain the `params` objects are JSON compatible. The stream's operator definitions must be serialized before pushing definitions to the stream's child process.

### Environment variables

Finch passes all of the main process' environment variables to the stream's child process at the time of creation. Changes to environment variables in the main process are not pushed to the stream's child process.

Remember, environment variable values are always strings.

- `FINCH_DEBUG` - Default `"false"`
  - Will be `"true"` when the stream is run in debug mode by providing `--debug` to[`@finch/cli`](../packages/cli/).
- `FINCH_STABILITY_THRESHOLD` - Default `"2000"`
  - Duration in milliseconds that a file must have a consistent state before a change event is dispatched. Set using the `--stabilityThreshold` option of [`@finch/cli`](../packages/cli/).
  - Finch uses [`chokidar`](https://github.com/paulmillr/chokidar) for file watching. Read about [`awaitWriteFinish.stabilityThreshold`](https://github.com/paulmillr/chokidar#performance).

---

:bird:
