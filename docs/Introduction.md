:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# Introduction <!-- omit in toc -->

- [Project Guidelines](#project-guidelines)
- [Design principles](#design-principles)

Finch is a small library with open-ended capabilities. It allows for users to sequence an arbitrary series of operations. The result of an operation is provided to the next operation in the sequence.

These sequences are called [_streams_](Streams.md). Streams can process values indefinitely. A stream could, for example, run operations on each IRC message posted to a channel or on each file added to a directory. Each stream runs in parallel, isolated from one another.

It's the job of [_operators_](Operators.md) to provide values to a stream and perform operations on those values. Operators are tiny programs focused on doing one thing well. Each operator receives input from the stream, performs operations, then provides its output to the stream. You can [write your own operations](Write%20Your%20Own%20Operators.md) or [use Finch's own](/README.md#package-documentation).

We have plans to focus on [new operators and enhancements](https://github.com/mseeley/finch/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement) for our available operators.

Streams are defined declaratively using familiar JSON or YAML files. Each file is called a _stream definition_. It defines a list of _operator definitions_. Operators are configured using predictable, and limited, semantics. Finch runs streams [from the command line](../packages/cli/README.md). It's straightforward to [get started](Getting%20Started.md).

It wouldn't be an introduction without a bit of code. Below is a YAML stream definition which uses the [`@finch/values` operator](../packages/values/README.md) to yield lines of a Jack Kerouac haiku. The operator waits 1 second between lines. The haiku is repeated 3 times.

```yaml
---
# stream.yaml
- use: "@finch/values"
  params:
    values:
      - A balloon caught
      - in the tree – dusk
      - In Central Park zoo
      - Jack Kerouac
    delay: 1000
    times: 2
```

```
$ finch start stream.yaml
[cli/start] A balloon caught
[cli/start] in the tree – dusk
[cli/start] In Central Park zoo
[cli/start] Jack Kerouac
[cli/start] A balloon caught
[cli/start] in the tree – dusk
[cli/start] In Central Park zoo
[cli/start] Jack Kerouac
[cli/start] 🐦 Done
```

## Project Guidelines

- Be helpful - Provide thorough documentation and meaningful error messages.
- Encourage experimentation - Finch streams should be predictable and easy to control.
- Expect the unexpected - Finch should remain stable and helpful when encountering errors.
- Glide - Finch should feel lightweight, flexible, and responsive.

## Design principles

- Be predictable - features and implementations should succeed and fail predictably. Knowledge learned in one area should be applicable to similar areas.
- Fluent CLI grammar - commands should read like sentences. Fewer features and flags encourages fewer `-f[inger] --cramps`.
- Innovate at the edge - maintain a stable core while focusing on useful operators and applications of the core.
- Show your work - features are always accompanied by thorough behavior specs, api documentation, and usage documentation.

---

:bird:
