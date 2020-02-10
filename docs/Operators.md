:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# Operators <!-- omit in toc -->

- [Definitions](#definitions)
  - [Example](#example)
- [Passing parameters to definitions](#passing-parameters-to-definitions)
- [Smiling in the face of errors](#smiling-in-the-face-of-errors)
- [API](#api)
- [Advanced](#advanced)
  - [Resolution of `use`, `ignore`, `include`](#resolution-of-use-ignore-include)
  - [YAML quoting](#yaml-quoting)
  - [Regular expressions](#regular-expressions)

Stream's are composed of operators. Most operators accept a value, perform an operation, then yield one or more values to the next operator. Some operators only yield values of their own creation. Each stream typically has one operator responsible for creating interesting values and many operators responsible for taking action on values.

Naming of Finch's operators is important:

- operators with _topical names_ are creation operators. For instance, operators named `values`, `files-changed`, or `irc-messages` would yield their namesake values.
- while operators with _action names_ expect to perform an action on a value. Examples include, `regexp-ignore`, `json-stringify`, and `download-file`.

This convention communicates operator intent. As a result Finch's stream definitions are naturally more readable. Nothing prevents you from using a different convention for your own operators.

> :bird: Finch's selection of official operators is _currently_... sparse. You can [see what we have planned](https://github.com/mseeley/finch/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement). Or, if you're proficient with JavaScript, you can [write your own operators](./Write%20Your%20Own%20Operators.md).

## Definitions

Operators are defined declaratively. The definitions have a constrained API that allows them to be authored in JSON or YAML files. Definitions are validated against the [operator schema](../packages/core/schemas/operator.json).

At the root of an operator definition is a `use`, `ignore`, or `include` verb followed by a filename or Node.js module name value.

This verb suggests how the value is handled.

- `use`: the operator is _used_ by the stream.
- `ignore`: the operator is _ignored_ by the stream. This allows you to disable an operator without removing it from the stream definition.
- `include`: the filename points to another list of operator definitions which are included into the stream. The included file is another JSON or YAML file. JSON and YAML can `include` each other.

### Example

The intent of the example stream below is clear because of the naming convention and limited responsibilities of each operator.

<details>
<summary>Directory structure</summary>

```
$ ls -R
stream.yaml

./includes
download-then-notify.yaml

./operators:
download-url.js                messages-from-announce-bot.js
extract-url.js                 notify-channel.js
```

</details>

```yaml
---
# stream.yaml
- use: "./operators/messages-from-announce-bot"
- use: "@finch/regexp-accept"
  params:
    # Only messages containing "linux.iso" are passed downstream.
    pattern: "/linux\\.iso/"
- use: "./operators/extract-url"
- include: "./includes/download-then-notify.yaml"
```

```yaml
---
# download-then-notify.yaml
- use: "../operators/download-url"
- use: "../operators/notify-channel"
```

<details>
<summary>JSON</summary>

`stream.json`:

```json
[
  {
    "use": "./operators/messages-from-announce-bot"
  },
  {
    "use": "@finch/regexp-accept",
    "params": {
      "pattern": "/linux\\.iso/"
    }
  },
  {
    "use": "./operators/extract-url"
  },
  {
    "include": "./includes/download-then-notify.json"
  }
]
```

`download-then-notify.json`:

```json
[
  {
    "use": "../operators/download-url"
  },
  {
    "use": "../operators/notify-channel"
  }
]
```

</details>

## Passing parameters to definitions

The simple [definitions example](#definitions) isn't too flexible. Finch supports parameters passing to operators. Let's extract configuration allowing the same `messages-from-announce-bot` operator to be used by other streams.

```yaml
---
# stream.yaml
- use: "./operators/messages-from-announce-bot"
  params:
    server: "irc.server-a.com"
    channel: "#announce"
    user:
      email: "me@host.com"
      name: "me"
      password: "secret!"
- use: "./operators/extract-url"
  params:
    pattern: "/linux\\.iso/"
- include: "./includes/download-then-notify.yaml"
```

> :bird: Passing `params` to all operators included via `include` is unsupported.

## Smiling in the face of errors

Finch tries hard to give you tools to prevent the errors from spoiling your stream. Operator definitions have available error handling configuration which can smooth over transient errors:

- `retryCount` - The number of times an operator is retried. Set this thoughfully when interacting with services or effectful operators.
- `retryWait` - Number of milliseconds to wait before the first retry. Subsequent retries are then performed using an exponential back-off.

Sometimes an operator will never succeed. There's a final option that catches an error to prevent it from causing the entire stream to fail.

- `continueOnError` - Prevent the stream from ending when an operator encounters an unrecoverable error. Instead the value which caused the error is abandoned.

Let's parameterize the `download-then-notify` include and teach it to handle failures.

```yaml
---
# download-then-notify.yaml
- use: "../operators/download-url"
  # Retry the `download-url` operator 3 times.
  retryCount: 3
  # Continue stream if operator could not recover after retry.
  continueOnError: true
  # The `params` values are passed to the operator.
  params:
    destinationDirectory: "/Downloads"
- use: "../operators/notify-channel"
```

> :bird: Notice how `retryCount` and `continueOnError` are configured at the same indentation level as `params`.

## API

Below is the complete list of operator definition options and their default values:

- `continueOnError:Boolean` - Default `false`.
  - Should unrecoverable errors in an operator be ignored by the stream? When `false` an unrecoverable error in a operator will cause the stream to complete.
- `ignore:String`
  - The inverse of `use`. When `ignore` is present instead of `use` the operator is ignored.
- `params:Object`
  - Optional operator configuration object.
- `retryCount:Number` - Default is `0`.
  - Optional number of times to retry a operator.
- `retryWait:Number` - Default is `1000`.
  - Optional number of milliseconds to wait before the first retry. Subsequent retries are performed using an exponential back-off.
- `use:String`
  - The inverse of `off`. The value must resolve to an installed NPM module or the value must be an absolute file path; relative file paths are currently unsupported.

## Advanced

### Resolution of `use`, `ignore`, `include`

Finch resolves relative filenames relative to the file containing the operator definition. Relative filenames for files in the current directory should start with `./`.

Node.js modules are resolved using the typical `require.resolve()` behavior of the [Modules API](https://nodejs.org/docs/latest/api/modules.html#modules_modules).

### YAML quoting

YAML selectively requires wrapping string values in quotes. For example, neither the `greeting` and `farewell` below _require_ quotes. Regardless YAML doesn't complain about `farewell` including quotes.

```yaml
---
- use: "./my-operator"
  params:
    greeting: hello world
    farewell: "goodnight moon"
```

It's typically easier to wrap all string values in quotes than it is to worry about a missing quote causing trouble.

### Regular expressions

Regular expressions are a powerful tool for manipulating strings. Unfortunately they must be defined as strings for usage in JSON and YAML. Fortunately it's simple.

Let's take `/\.jpe?g/gi` as an example. This regular expression will match every occurence of `.jpg` and `.jpeg` in any mix of upper and lowercase letters.

- Regular expression: `/\.jpe?g/gi`
- As string: `"/\\.jpe?g/gi"`

> :bird: The `@finch/core` package exposes a `toRegExp` helper for operator authors.

---

:bird:
