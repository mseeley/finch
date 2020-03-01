:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# `@finch/regexp-ignore`

> :bird: Stability: 2 - Stable (added in 1.0.0)

Conditional operator that only yields the `value` it was provided when the value does not match its regular expression `pattern`.

Regular expressions are capable of matching an enormous variety of conditions. Tools like [regexr.com](https://regexr.com) are an excellent resource for regular expression learing an testing.

Related: [`@finch/regexp-accept`](../regexp-accept/README.md)

## Installation

```
npm install -g @finch/regexp-ignore
```

:bird: Omit `-g` flag to install within the current directory.

## Params

- `pattern`: a regular expression used to test the string `value`.

## Examples

Ignore any `value` which contains _the characters_ `rail`; case insensitive:

```json
{ "use": "@finch/regexp-ignore", "params": { "pattern": "/rail/i" } }
```

:bird: Regular expressions match characters. The `/rail/i` expression will match `frail`, `grails`, `Braille`, etc.

Ignore any `value` which contains _the word_ `rail`; case insensitive

```json
{ "use": "@finch/regexp-ignore", "params": { "pattern": "/\\brail\\b/i" } }
```

Ignore any `value` which is precisely `Hello World`:

```json
{ "use": "@finch/regexp-ignore", "params": { "pattern": "/^Hello World$/" } }
```

Ignore any `value` which contains _the words_ `hello` or `world`; case insensitive:

```json
{
  "use": "@finch/regexp-ignore",
  "params": { "pattern": "/\\b(hello|world)\\b/i" }
}
```

:bird: Case insensitive matches are useful to focus on the characters and words while ignoring their presentation.

Sometimes it's hard to get your head around a complicated `pattern`. Not to mention that a `pattern` can be quite long. Solving both issues are the `any` and `all` parameters. Each parameter accepts an array of regular expressions.

The `any` usage below breaks `/\\b(hello|world)\\b/i` into two smaller patterns. A value which matches at least one of the patterns is ignored.

```json
{
  "use": "@finch/regexp-ignore",
  "params": { "any": ["/\\bhello\\b/i", "/\\bworld\\b/i"] }
}
```

The `all` operator works similarly. A value which matches each of the patterns is ignored.

```json
{
  "use": "@finch/regexp-ignore",
  "params": { "all": ["/\\bhello\\b/i", "/\\bworld\\b/i"] }
}
```

They can even be used together. A value must match each of the `all` operators and at least one of the `any` patterns.

```json
{
  "use": "@finch/regexp-ignore",
  "params": {
    "all": ["/\\bhello\\b/i", "/\\bworld\\b/i"],
    "any": ["/\\bcat\\b/", "/\\bdog\\b/"]
  }
}
```

---

:bird:
