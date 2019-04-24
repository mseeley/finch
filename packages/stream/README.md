# `@finch/stream`

Finch's babbling brook.

## Interface

```js
const {
  createStream,
  empty,
  validateStream
} = require("@finch/stream");
```

- `createStream(Object[])`: Creates the stream RxJS `Observable`.
- `empty()`: This special return value is used by stages to indicate they have completed successfully but have no value to yield. The retur value from `empty()` should be treated as an opaque token.
- `validateStream(Object[])`: Validates a stream definition. Returns `null` if the stream validated successfully. Otherwise it returns an array of error information.

## Overview

A stream arranges a series of asynchronous activities called stages. 

### A first look

This basic stream has two stages. The first stage emits a fixture value, an integer in this case, every 1s. The second stage simply logs the value from the previous stage.

```js
const stream$ = createStream([
  { use: "@finch/emitters/fixture" },
  { use: "@finch/operators/console" }
]);
```

`createStream` used `require` to load the two Node.js modules specified by `use`. Each module exports a function that is eventually invoked once the stream is flowing.

Subscribing to a stream starts the flow of values.

```js
stream$.subscribe(
  value => {
    console.log(`Final value: ${value}`);
  }
);
```

Console and terminal will then show two messages each second until the process is manually stopped. The first message is logged by `operators/console` to illustrate the value provided to that stage. The second message is logged by the subscriber to illustrate that the value has been processed by every stage.

```
0
Final value: 0
1
Final value: 1
2
Final value: 2
...
```

Remember, streams control the flow of data from and between stages. Streams themselves are suprisingly simple; the real power comes from a stream's stages.

## Stages

A stream is composed of stages. All stages are pure functions with a limited API. This keeps them very easy to author, test, and arrange. Values are piped from one stage to another.

### Stage types

There are three types of stages: _emitters_, _operators_, and _transmitters_.

#### Emitters

Emitters are typically one of the first stages in a stream. Each stream has a single emitter.

An emitter stage accepts no value. Instead it emits its own values over time. Emitters are typically monitoring something then emitting values when that something is interesting. Example emitters could monitor files, IRC channels, RSS feeds, etc.

Emitters are authored as an RxJS `Observable`. They are expected to emit one to many values over time. The entire stream completes when the emitters completes. You need very little RxJS knowledge to author your own emitters.

#### Operators

After value is emitted to the stream it's the operators which take action on the value.

An operator receives one value at a time and is expected to return  a next value. The next value can be the same value provided to the stage, a new value, or a special `empty()` value when the operator has nothing to provide to the stream. This simple interface means operators can be implemented as an `async/await` function, as a `Promise`, or even as an `Observable`.

The stream below combines `emitters/fixture` with an imaginary `add10` operator. The `emitters/fixture` emitter emits one number each second. The `add10` operator accepts a value from the emitter, adds 10, then returns another value. The final value then reaches the subscriber.

```js
createStream([
  { use: "@finch/emitters/fixture" },
  { use: "add10" }
])
.subscribe(
  value => {
    console.log(`Final value: ${value}`);
  }
);
```

The console and terminal will display a message until the process is manually stopped.

```
Final value: 10
Final value: 11
Final value: 12
...
```

#### Transmitters

Transmitters combine behaviors of emitters and operators. Their naming suggests they are "transforming emitters".

A transmitter accepts a single value, transforms it in some way, emits one or more values, then completes. This behavior requires that transmitters are implemented as an RxJS `Observable`. 

```js
createStream([
  { use: "@finch/emitters/fixture", params: { value: "Hello world" } },
  { use: "@finch/operators/console" },
  { use: "@finch/transmitters/string-split", params: { separator: /\s+/ } },
  { use: "@finch/operators/console" }
])
.subscribe(
  value => {
    console.log(`Final value: ${value}`);
  }
)
```

The console and terminal will display a repeating pattern of messages until the process is manually stopped. Notice how the the first `operators/console` logs the full `"Hello world"` value. Also notice how the second `operators/console` logs each word individually. 

```
Hello world
Hello
Final value: Hello
world
Final value: world
...
```

The `transmitters/string-split` is transforming the single `"Hello world"` value into multiple individual values. This is highly useful when blobs of structured data are emitted.

### Disabling a stage

Changing the `use` keyword to `off` will disable a stage without removing it from the stream definition. The stream will continue as if the stage wasn't defined.

For example, disabling the imaginary `add10` stage results in the emitted value reaching the subscriber unchanged.

```js
createStream([
  { use: "@finch/emitters/fixture" },
  { off: "add10" }
])
.subscribe(
  value => {
    console.log(`Final value: ${value}`);
  }
);
```

The console and terminal will display a repeating pattern of messages until the process is manually stopped.

```
Final value: 0
Final value: 1
Final value: 2
...
```

### Providing parameters to a stage

The declarative syntax used to author stages allows for passing parameters to a stage through a `params` Object.

In the example below `emitters/fixture` is configured to emit `"Hello world"` while `transmitters/string-split` is configured to split the value it receives using a JavaScript regular expression matching whitespace.

```js
createStream([
  { use: "@finch/emitters/fixture", params: { value: "Hello world" } },
  { use: "@finch/transmitters/string-split", params: { separator: /\s+/ } }
])
```

### Configuring a stage

You've already seen some of the ways that a stage can be configured by way of `use`, `off`, and `params` values. Below is the complete list of configuration options:

- `continueOnError:Boolean` - Default `true`. Should unrecoverable errors in a stage be ignored by the stream? When `false` an unrecoverable error in a stage will cause the stream to complete.
- `name:String` - Optional name that can be applied to a stage for easier debugging or identification.
- `off:String` - The inverse of `use`. When `off` is present instead of `use` the stage is skipped.
- `params:Object` - Optional stage configuration object.
- `retryCount:Number` - Optional number of times to retry a stage. Default is `0`.
- `retryWait:Number` - Optional number of milliseconds to wait before the first retry. Defaults is `1000`. Subsequent retries are then performed using an exponential back-off.
- `use:String` - The inverse of `off`. The value must resolve to an installed NPM module or the value must be an absolute file path; relative file paths are currently unsupported.
- `verbose:Boolean` - Optional. Default `false`. When `true` a stream may log additional information at runtime.

You can review the [stream schema](lib/schemas/stream.json) for additional context.

### Errors and recovery

All stage types support the same error recovery behavior.
An error occurring in an operator will cause the operator to be retried. If the retries fail the value is dropped and the stream is unaffected. The timing and quantity of retries and handling of a failed retry is configurable per stage.

See the `continueOnError`, `retryCount`, and `retryWait` stage configuration information.

### Authoring a stage

Each stage is authored within a single file. The file's export is a factory function. The function accepts `{ params, value }` and the returns a `Promise` or an RxJS `Observable`. Keep your stages small and focused. Chain stages together to handle more complicated logic.

Stage's are implemented as pure functions. Their implementations by extension should be stateless. Storing local state across multiple invocations of a stage is a massive antipattern; tread carefully.

First we'll implement the imaginary `add10` operator used above using an `async` function:

```js
module.exports = async ({ params, value }) => {
  // A `params` object is always provided for convenience.
  return value + 10;
};
```

Returning a `Promise` is a graceful approach for operators to wrap callback based APIs:

```js
const legacyService = require("./legacy-service");

module.export = ({ params, value } => {
  return new Promise((resolve, reject) => {
    // Always handle errors!
    try {
      legacyService(value, params, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
});
```

Sometimes a stage completes successfully yet has no value to yield to the next stage. This is common with filtering operators. In this situation an `empty()` helper is returned.

The operator below will only yield even numbers. Any non-even numbers reaching this operator are then prevented from traveling further down stream.

```js
const { empty } = require("@finch/stream");

module.exports = ({ value }) =>
  Promise.resolve(value % 2 ? empty() : value);
```

An RxJS `Observable` can be used to author any stage type. Learn more about [stage conventions]() first to be certain you fully understand the expectations involved in using an RxJS `Observable`.

Let's author a string splitting transmitter:

```js
const { Observable } = require("rxjs");

module.exports = ({ params, value }) => {
  // Always handle errors!
  return new Observable.create(subscriber => {
    try {
      const values = value.split(params.separator);

      values.forEach(v => subscriber.next(v));

      subscriber.complete();
    } catch (error) {
      subscriber.error(error);
    }
  });
};

```

### Convention and flexibility

You've seen how each stage type has the same API and behavior. This is no coincidence; in reality there is only a single type of stage.  The differences between stages are _purely in convention_. 

_These conventions run deep_:

- Emitters ignore any input value, emit many values, and may never complete. Emitters are cold observables.
- Transmitters accept an input value, emits 1 or more values, then complete.
- Operators accept an input value, emit 1 value, then complete.

The consistent stage interface and simple stage-type conventions are one of the main reasons that Finch is predictable and fun to use.

## Streams

Streams are a thin wrapper around stages. The stage and stream format is declarative and designed to support serialization to/from JSON and a subset of YAML compatible with JSON. The [stream schema](lib/schemas/stream.json) enforces stream composition.

A stream should be a cold observable. It should wait to emit events until it has a subscriber.

It's important to understand that subscribing to a stream multiple times creates a new series of values. There is no state shared between subscribers to the same stream RxJS `Observable`.

### Controlling streams

A stream is considered "completed" when its emitter has emitted all of its values. In the case of long-running streams this condition may never be met. Streams are RxJS `Observable` instances. This means you have a robust set of tools for controlling streams.

For example, this stream is completed, using `take`, after the third value:

```js
const { take } = require("rxjs/operators");

createStream([
  { use: "@finch/emitters/fixture" }
])
.pipe(
  take(3)
)
.subscribe(
  value => {
    console.log(`Final value: ${value}`);
  },
  error => {
    console.error(error);
  },
  () => {
    console.log("Stream has completed!")
  }
);
```

The console and terminal will then display these messages:

```
Final value: 0
Final value: 1
Final value: 2
Stream has completed!
```

### Validating streams

The `createStream` method assumes its input argument is valid. It's in your best interest to first confirm validity using the `validateStream` method.

```js
const { createStream, validateStream } = require("@finch/stream");
const myStream = require("./myStream.json");

const validationErrors = validateStream(myStream);

if (validationErrors) {
  // Handle the error(s).
} else {
  // Create the stream.
}
```

The `validateErrors` object is an array of error summary objects. Each object in in the array has the following members:

- `pointer:String`: A [JSON pointer](https://tools.ietf.org/html/rfc6901) to the part of the stream configuration that is invalid.
- `errors:String[]`: One or more error messages that describe the error or errors encountered.