:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# Streams <!-- omit in toc -->

- [Overview](#overview)
- [Life cycle](#life-cycle)
- [Watching dependencies](#watching-dependencies)
- [Error handling](#error-handling)
  - [Stream definition file or directory cannot be found](#stream-definition-file-or-directory-cannot-be-found)
  - [Stream definition fails resolution](#stream-definition-fails-resolution)
  - [Stream fails due to operator error](#stream-fails-due-to-operator-error)

## Overview

Finch's streams are declarative sequences of [operators](./Operators.md). Streams coordinate the flow of values to and from operators.

Streams and the operators within are defined declaratively. These definitions are authored using JSON or a JSON-compatible subset of YAML. The simple and constrained definition syntax teaches patterns that are applicable to every operator and every stream.

Streams requires one or more operators. In practice a typical stream will have at least two operators. One operator is responsible for yielding its own values. While the other operator(s) accept a value, perform some action, then respond with another value.

Multiple streams are run at once; each in their own process. This encourages parallel operations and prevents streams from interfering each other. It is not a security mechanism. You should only run trusted operators.

The stream implementation is part of [`@finch/core`](../packages/core/README.md).

## Life cycle

An _active_ stream is one which is ready to process current or future values. Streams remain active as long as the operator yielding values still has values to yield or is waiting until yielding another value. For example:

- An operator which yields the name of files in a directory would complete after yielding the name of the last file. This completion would cause the stream to also complete.
- An operator which yields the name of files that change would naturally would behave differently. The operator will wait then yield file names as files change. This waiting keeps the stream active indefinitely.

Indefinitely active (long-lived) streams are the basis of Finch's monitor-then-respond capability.

## Watching dependencies

Before a stream is executed all of its dependencies are resolved recursively.

The example stream below uses [`@finch/values`](../packages/values/README.md) to yield 3 file names. Additional operator definitions are included from `./operators/common.yaml`.

`stream.yaml`:

```yaml
---
- use: "@finch/values"
  params:
    values:
      - "/file-a.ext"
      - "/file-b.ext"
      - "/file-c.ext"
# Any included operators can include other operators.
- include: "./operators/common.yaml"
```

<details>
  <summary>JSON syntax</summary>

`stream.json`:

```json
[
  {
    "use": "@finch/values",
    "params": {
      "values": ["/file-a.ext", "/file-b.ext", "/file-c.ext"]
    }
  },
  {
    "include": "./operators/common.yaml"
  }
]
```

</details>

`common.yaml`:

```yaml
---
# This is a very simple operator that ignores any values
# which include "file-b.ext".
- use: "@finch/regexp-ignore"
  params:
    pattern: "/file-b\\.ext/"
```

The stream for `stream.yaml` has two dependencies: `stream.yaml` and `common.yaml`. Changes to a dependency, by default, have no effect once the stream starts. This is stable but not very interesting.

Streams can also be run in watch mode, see [`--watch`](../packages/cli/README.md#start). In watch mode a stream will automatically restart anytime a dependency changes. This is particularly handy when you'd like to make changes to a stream without manually restarting one or more streams.

Watch mode is also intended to be paired with `@finch/cli` and a glob pattern. Finch is instructed to watch a for stream definition files using a glob. You can then add, change, and remove stream definition files whenever you'd like. Finch automatically starts, restarts, and stops associated streams. This is a great approach when running Finch on a dedicated device.

```
$ finch start *.yaml --watch
```

## Error handling

Finch is careful to avoid an error in one stream from affecting another stream. Streams typically experience errors while preparing resolving stream definitions and executing operators.

Error handling adapts when intentionally running a single stream and when potentially running multiple streams. The table below breaks down Finch's actions when running streams from `@finch/cli`.

> :bird: Filenames below are just conveniently named examples. You're actual stream files will probably have different filenames.

### Stream definition file or directory cannot be found

#### Examples <!-- omit in toc -->

```
finch start {filename}
```

```
finch start ./{dirname}/ --watch
```

```
finch start "./{dirname}/*.yaml" --watch
```

#### Behavior <!-- omit in toc -->

Finch exits immediately.

### Stream definition fails resolution

A stream's operator definitions and dependencies must be resolved before the stream is run. This resolution will fail when stream or operator definitions are invalid or when dependencies are missing.

#### Example <!-- omit in toc -->

```
finch start {filename}
```

#### Behavior <!-- omit in toc -->

Finch exits immediately.

#### Example <!-- omit in toc -->

```
finch start {dirname|glob}
```

#### Behavior <!-- omit in toc -->

Terminates failed streams. Runs resolved streams. Exits after all streams fail or complete.

#### Example <!-- omit in toc -->

```
finch start {dirname|glob} --watch
```

#### Behavior <!-- omit in toc -->

Terminates failed streams. Runs resolved streams. Awaits stream definition file changes indefinitely. File change triggers stream to re-run.

### Stream fails due to operator error

Behavior of an operator error is handled identically to behavior during stream definition resolution. Although Finch provides an additional tool that prevents a bad operator from failing its entire stream. The `--continue` option can be used to protect streams from operator problems. You'll want to use this sparingly; it addresses a side-effect not the root-cause of the operator problem. Running into an error in an official Finch operator? Please let us know!

#### Example <!-- omit in toc -->

```
finch start {filename|dirname|glob} --continue
```

> :bird: `--continue` and `--watch` can be used together.

#### Behavior <!-- omit in toc -->

An unexpected value or bug in an operator can lead to unexpected errors. The `--continue` operator will stop the flow of a `value` that an operator cannot process without an error. This is useful to keep the stream processing good values.

If you're dealing with a transient error, an error that may resolve by retrying, include the [`retryCount` option](./Operators.md) in your operator definition.

---

:bird:
