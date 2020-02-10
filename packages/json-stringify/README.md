:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# `@finch/json-stringify`

> :bird: Stability: 2 - Stable (added in 0.0.0)

Tranformational operator that yields the JSON representation of the input `value`.

See [Mozilla's documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) for more information.

## Installation

```
npm install -g @finch/json-stringify
```

:bird: Omit `-g` flag to install within the current directory.

## Params

- `replacer`: an array of `String` and `Number` objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string.
- `space`: a String or Number object that's used to insert white space into the output JSON string for readability purposes.

:bird: A `replacer` function is only supported by programatic streams. Streams created from stream definition files only support `replacer` array values.

## Examples

Serialize the `value` object to a readable JSON string:

```json
{ "use": "@finch/json-stringify", "params": { "space": 2 } }
```

Serialize _only_ the `hello` attribute of the `value` object.

```json
{ "use": "@finch/json-stringify", "params": { "replacer": ["hello"] } }
```

:bird: Using the `replacer` is useful to focus seriaization on a specific part or parts of an object. This avoids serialization issues due to other parts of the object and provides a cleaner `value` to the next operator.

---

:bird:
