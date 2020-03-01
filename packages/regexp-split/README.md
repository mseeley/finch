:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# `@finch/regexp-split`

> :bird: Stability: 2 - Stable (added in 1.0.0)

Yields one or more values after splitting the string `value` using a regular expression.

Regular expressions are capable of splitting strings on an enormous variety of conditions. Tools like [regexr.com](https://regexr.com) are an excellent resource for regular expression learing an testing.

Read more about regular expression handling in the [Getting Started](../../docs/Getting%20Started.md) guide.

## Installation

```
npm install -g @finch/regexp-split
```

:bird: Omit `-g` flag to install within the current directory.

## Params

- `pattern`: a regular expression used to split the `value`.
- `strict`: when true the `pattern` must be found in the `value` for a split to be performed.

## Examples

Split `"0,1,2"` into `0`, `1`, and `2` values:

```json
{
  "use": "@finch/regex-split",
  "params": { "pattern": "/,/g" }
}
```

Split `"Hello World"` into `"Hello"` and `"World"` values:

```json
{
  "use": "@finch/regex-split",
  "params": { "pattern": "/\\s+/g" }
}
```

By default the full `value` will be yielded if the `pattern` is not found in the `value`. The example below will not find `,` in `Hello World` and will yield `Hello World`:

```json
{
  "use": "@finch/regex-split",
  "params": { "pattern": "/,/" }
}
```

The example below will find `,` in `Hello World,Goodnight Moon` and will yield `Hello World` and `Goodnight Moon`:

```json
{
  "use": "@finch/regex-split",
  "params": { "pattern": "/,/" }
}
```

---

:bird:
