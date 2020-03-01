:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# `@finch/values`

> :bird: Stability: 2 - Stable (added in 1.0.0)

Utility operator that yields static values then completes. This operator is typically used to feed static values to a stream during development.

## Installation

```
npm install -g @finch/values
```

:bird: Omit `-g` flag to install within the current directory.

## Params

- `delay`: time in milliseconds to wait between values. This allows for yielding values on an interval.
- `times`: number of times to yield values. Use `-1` to repeat indefinitely. Default value is `1`.
- `values`: any iterable value. Typically this will be an array of values. The values should always be JSON serializable.

## Examples

Yields `42` once then complete:

```json
{ "use": "@finch/values", "params": { "values": [42] } }
```

Yields `4` then `2` once then complete:

```json
{ "use": "@finch/values", "params": { "values": "42" } }
```

Yields `42` three times then complete:

```json
{ "use": "@finch/values", "params": { "values": [42], "times": 3 } }
```

Yields `42` indefinitely while waiting 100ms after each yield:

```json
{
  "use": "@finch/values",
  "params": { "values": [42], "times": -1, "delay": 100 }
}
```

Same functionality, although this time authored using YAML:

```yaml
use: "@finch/values"
params:
  values:
    - 42
  times: -1
  delay: 100
```

---

:bird:
