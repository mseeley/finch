:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# `@finch/core`

Finch's tools to create observable streams and operators. This API documentation is intended developers implementing their own services built onto Finch.

:bird: Finch's [introduction](../../docs/Introduction.md) and [getting started](../../docs/Getting%20Started.md) guides are intended for everyone.

## Installation

```
npm install -g @finch/core
```

:bird: Omit `-g` flag to install within the current directory.

## API

Finch does not expose TypeScript typings. But, the API below is documented using them for clarity.

---

### `createStream`

> :bird: Stability: 2 - Stable (added in 1.0.0)

```ts
type OperatorDefinition = {
  continueOnError: boolean;
  debug: boolean;
  include: string;
  name: string;
  off: string;
  params: Record<string, any>;
  retryCount: number;
  retryWait: number;
  use: string;
};

type Options = {
  continueOnError?: boolean;
  definitions: OperatorDefinition[];
  resolveFrom: string;
  shouldWatch?: boolean;
};

function createStream(options: Options): Rx.Observable<any>;
```

[Implementation](createStream) | [Unit tests](createStream.spec.js)

#### Description

This is Finch's white rabbit and magician's hat. Provides an Observable for a single stream definition. A stream definition is composed of one or more [operator definitions](../../docs/Operators.md).

See the [stream schema](schemas/stream.json) for more information.

### Options

- `continueOnError`: When `true` it enables an operator to error without terminating the stream. This is useful to prevent unexpected edge cases in operators from terminating streams.
- `definitions`: An array of [operator definitions](../../docs/Operators.md).
- `resolveFrom`: An absolute pathname used to resolve relative `use` and `include` operator options.
- `shouldWatch`: When `true` it causes the streams to restart when one of its dependencies changes.

### Implementation Details

- When watching, all stream definitions are re-resolved whenever any definition changes.
- A stream is executed in a separate process. It's vital to keep operator definitions JSON serializable.

---

### `createStreamFromPath`

> :bird: Stability: 2 - Stable (added in 1.0.0)

```ts
type Options = {
  continueOnError?: boolean;
  pathname: string;
  shouldWatch?: boolean;
};

function createStreamFromPath(options: Options): Rx.Observable<any>;
```

[Implementation](createStreamFromPath.js) | [Unit tests](createStreamFromPath.spec.js)

#### Description

Provides an Observable composing one or more streams together. Stream definitions, read from files, are then piped through `createStream`. This Observable is the basis for the [`start` command of `@finch/cli`](../cli/README.md#start).

#### Options

- `continueOnError`: When `true` it enables an operator to error without terminating the stream. This is useful to prevent unexpected edge cases in operators from terminating streams. See the [operators guide](../../docs/Operators.md) for more information.
- `pathname`: A filename, dirname, or glob pattern to watch. Must be absolute an path.
- `shouldWatch`: When `true` it causes a couple handy behaviors.
  - Streams will restart when their file or a file of one of their dependencies changes.
  - New streams will start when watching a any dirname or some glob patterns.

#### Implementation Details

By design one stream will not affect another stream.

- An error in one stream will not terminate the outer Observable when there is a possibility for multiple streams to be running.
- Restarting one stream will not restart other streams.
- Each stream is run in a separate child process for isolation and multithreading.

---

### `EMPTY`

> :bird: Stability: 2 - Stable (added in 1.0.0)

```ts
function EMPTY(): string;
```

[Implementation](EMPTY.js) | [Unit tests](EMPTY.spec.js)

#### Description

Finch operators selectively return the result of calling this function. The value acts as a sentinel value which signals to the stream that propagation of the `value` provided to the operator should terminate at that operator.

This enables operators to act as filters which gracefully reject specific `value` values.

The return value of this function should be treated as opaque. Do not base any logic on the return value itself; it's a Finch implementation detail.

---

### `localNameOf`

> :dragon: Stability: 1 - Experimental (added in 1.0.0)

```ts
function localNameOf(filename: string): string;
```

[Implementation](localNameOf.js) | [Unit tests](localNameOf.spec.js)

#### Description

This is a utility helper which extracts a standardized and version of a filename in the Finch source tree. The return value is useful for prefixing logging and error messages.

_Finch revisions are expected to introduce breaking changes._

---

### `toRegExp`

> :bird: Stability: 2 - Stable (added in 1.0.0)

```ts
function toRegExp(pattern: string): RegExp;
```

[Implementation](toRegExp.js)

#### Description

This helper converts a serialized regular expression into a true regular expression.

---

### `watchFiles`

> :bird: Stability: 2 - Stable (added in 1.0.0)

```ts
type Ready = {
  event: "ready";
};

type Watched = {
  event: "add" | "change" | "unlink";
  filename: string;
  present: boolean;
};

type Options = {
  filterAdd: boolean;
  filterChange: boolean;
  filterReady: boolean;
  filterUnlink: boolean;
  ignoreInitial: boolean;
  pathnames: Array<string | glob>;
};

function watchFiles(options: Options): Rx.Observable<Ready | Watched>;
```

[Implementation](watchFiles.js) | [Unit tests](watchFiles.spec.js)

#### Description

Provides an Observable which yields events when files are added, changed, or removed.

#### Options

- `pathnames`: Array of actual pathnames or glob patterns to watch. Each member must be absolute an path.
- `filterAdd`: Yields `Watched` any time a file is added. `Watched` is also yielded as files are initially discovered. Provide `ignoreInitial` if you are not interested in add events for exiting files.
- `filterChange`: Yields `Watched` any time a file is changed.
- `filterUnlink`: Yields `Watched` any time a file is deleted.
- `filterReady`: Yields a special `{ event: 'ready' }` value once the watcher has completed initialization. This includes yielding all initial `add` events.
- `ignoreInitial`: `true` by default. Avoid yielding existing files as `add` events when initializing the watcher.

#### Implementation Details

`filterAdd`, `filterChange`, and `filterUnlink` have intelligent default behavior:

- Opt into receiving all events by configuring none of the above.
- Opt into specific events by configuring any of the options.
- `filterReady` has no affect on values of other filter operators.

Dot files, `node_modules` directories, `package.json`, and `package-lock.json` files are automatically ignored while resolving glob patterns. There is no way to change this behavior.

The watcher uses the `FINCH_STABILITY_THRESHOLD` environment value to determine how many milliseconds a filesize must remain stable before considering the file's addition or removal complete.

`watchFiles` [uses Chokidar](https://github.com/paulmillr/chokidar) extensively.

---

:bird:
