:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# `@finch/cli`

Finch's command line interface can be used to execute stream definition files.

## Installation

```
npm install -g @finch/cli
```

## Flags

The flags below are supported by most commands.

- `--debug`
  - Causes Finch to log verbosely.
- `--help`
  - Display usage then exit.
- `--stabilityThreshold`
  - Millisecond duration a file size must remain static before Finch responds to a file change.
  - Default is `2000`.
- `--version`
  - Display CLI version then exit.

## Commands

### `start`

> :bird: Stability: 2 - Stable (added in 0.0.0)

Run one or more stream definitions from the command line. Pressing `Ctrl-C` or closing the terminal will terminate all streams.

```
finch start [pathname] [...flags]
```

#### Example

Run specific streams. Don't allow an operator error to terminate its stream.

```
finch start "streams/my-streams-*.json" --continue
```

#### Arguments

- `pathname`
  - An absolute or relative file name.
  - An absolute or relative directory name. Finch will shallowly find all `.json`, `.yml`, and `.yaml` stream definitions (notice lowercase file extensions). Finding stream definitions deeply can be done with a glob pattern.
  - A glob pattern. Glob patterns should be quoted to allow the glob resolution to occur within Finch instead of the operating system. Always use `/` path separate in glob patterns; even on Windows. Use `\` for escaping characters.

#### Flags

- `--continue`
  - Prevent unrecoverable operator errors from terminating a stream. Instead a stream will cease operation gracefully. Conceptually the `--continue` flag allows stepping over a transient operator error.
  - When `--watch` is supplied the stream will await a change to its definition file or one of the its dependencies.
- `--watch`
  - Causes a stream to react to file changes for its definition file or a dependency. A stream will restart one of these files changes. The restart will interrupt current activity in a stream. Typically `--watch` is best during development.

#### Error handling

By design, an error in one stream should never affect another stream. Each stream is run within a separate process. Streams are coordinated to re-run when applicable.

- Errors consuming the stream definition will typically terminate a stream. When `--watch` is supplied a terminated stream will remain idle until the stream's definition or a dependency changes.
- Unrecoverable errors within an operator will cause its stream to terminate unless the `--continue` flag is supplied.

---

:bird:
