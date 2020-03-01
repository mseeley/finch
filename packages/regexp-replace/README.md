:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# `@finch/regexp-replace`

> :bird: Stability: 2 - Stable (added in 1.0.0)

Transformation operator that yields the `value` it was provided after replacing a regular expression `pattern` with a `replacement`.

Regular expressions are capable of replacing strings in an enormous variety of conditions. Tools like [regexr.com](https://regexr.com) are an excellent resource for regular expression learing an testing.

Read more about regular expression handling in the [Getting Started](../../docs/Getting%20Started.md) guide.

## Installation

```
npm install -g @finch/regexp-replace
```

:bird: Omit `-g` flag to install within the current directory.

## Params

- `pattern`: a regular expression used to match within the `value`.
- `replacement`: a string that is replaced for the matched pattern(s).

## Examples

Replace the first occurence of the word `Hello` with `Goodbye`:

```json
{
  "use": "@finch/regexp-replace",
  "params": { "pattern": "/\\bHello\\b/", "replacement": "Goodbye" }
}
```

Replace every occurence of the word `Hello` with `Goodbye`:

```json
{
  "use": "@finch/regexp-replace",
  "params": { "pattern": "/\\bHello\\b/g", "replacement": "Goodbye" }
}
```

---

:bird:
