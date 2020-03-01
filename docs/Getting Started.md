:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# Getting Started <!-- omit in toc -->

- [Install Node](#install-node)
- [Create a Finch directory](#create-a-finch-directory)
- [Author your first stream](#author-your-first-stream)
- [Operators almighty](#operators-almighty)
- [Watching stream definition files](#watching-stream-definition-files)
- [What's next?](#whats-next)

This guide will walk you through installing Finch then authoring and running some basic streams from the command line.

Finch requires comfort running simple commands on the command line and editing text files.

## Install Node

While Finch will always officially support the oldest Node.js LTS version we'll always do our best to support recent Node.js versions. Let us know if you spot a bug running in an a newer version.

If you already a have Node.js and npm or yarn installed then you're probably done. If not please see other setup guides.

## Create a Finch directory

Create then enter a directory to hold your Finch streams:

```
md finch && cd finch
```

Initialize NPM in this directory. Initialization will create a `package.json` file that helps manage the installed versions of Finch operators. Go ahead and select the defaults, the values aren't meaningful.

```
npm init
```

Then install Finch into this directory. We'll start with the Finch CLI. It finds files containing Finch stream definitions.

```
npm install @finch/cli
```

Once that's complete you can run the CLI using `npx` (or `yarn` if you prefer):

```
npx finch --help
```

A Finch _stream definition_ is a list of _operator definitions_. Operators are combined in novel ways to perform any variety of tasks.

Run the command below to install 3 basic operators. You can read more about them, and others, in the [package documentation](/README.md#package-documentation).

```
npm install @finch/values @finch/regexp-accept @finch/regexp-ignore
```

## Author your first stream

Finch CLI finds stream definitions in JSON and YAML files. YAML is typically more human friendly although JSON is more familiar to many people. The stream definitions are required to be JSON compatible regardless of which format you choose.

Let's author the similar streams in YAML and JSON for comparison. Save the files below in the directory just created.

`eliot.yaml`:

```yaml
---
- use: "@finch/values"
  params:
    values:
      - Do
      - I
      - dare
      - "/"
      - Disturb
      - the
      - universe?
    delay: 1000
```

`eliot.json`:

```json
[
  {
    "use": "@finch/values",
    "params": {
      "values": ["Do", "I", "dare", "/", "Disturb", "the", "universe?"],
      "delay": 1000
    }
  }
]
```

Now, for the fun. Make sure you're still in the diretory created above then enter this command:

```
npx finch start .
```

Each stream will yield one word each second. After all words are yielded then the streams complete. Finch is running each stream at the same time in different processes.

:bird: Experiment with the `delay` value in each stream. Or, make `eliot.yaml` run forever by `times: -1` directly beneath `delay: 1000`.

## Operators almighty

Finch streams are composed of operators. An operator typically receives a `value` provided by the previous operator, does something with the `value`, then provides a `value` to the next operator. Operators don't know anything about the other operators in the stream. They're each an independent link in a larger chain.

Update the stream definitions to include new operators:

`eliot.yaml`:

```yaml
---
- use: "@finch/values"
  params:
    values:
      - Do
      - I
      - dare
      - "/"
      - Disturb
      - the
      - universe?
    delay: 1000
- use: "@finch/regexp-accept"
  params:
    pattern: "/^(Do|dare|Disturb)$/"
```

`eliot.json`:

```json
[
  {
    "use": "@finch/values",
    "params": {
      "values": ["Do", "I", "dare", "/", "Disturb", "the", "universe?"],
      "delay": 1000
    }
  },
  {
    "use": "@finch/regexp-ignore",
    "params": {
      "pattern": "/^(Do|dare|Disturb)$/"
    }
  }
]
```

`eliot.yaml` accepts any `value` that is the word `Do`, or `dare`, or `Disturb`. While `eliot.json` ignores any `value` that is any of those same words.

Re-run the streams:

```
npx finch start .
```

The filtering causes each strem to yield unique values. This is a simple example. [`@finch/regexp-accept`](packages/regexp-accept/README.md) and [`@finch/regexp-ignore`](packages/regexp-ignore/README.md) are quite helpful when picking/choosing which values arrive at future operators.

:bird: Remember the streams are running independently in parallel. You may or may not see the words in sentence order.

## Watching stream definition files

It would be inconvenient to stop all streams any time one file needed to be updated. Luckily Finch's `--watch` mode has you covered.

Run the streams in watch mode:

```
npx finch start . --watch
```

As before the streams will yield all of their values. But, now instead of exiting the streams wait for file changes. Go ahead, change one of the word `values` or the `delay` and see what happens.

:bird: The file watching may not work correctly when the stream definitions are on a network volume.

## What's next?

Keep experimenting with the streams made above. Then stop back by the [guides](/README.md#guides) and [package documentation](/README.md#package-documentation) for more information.

---

:bird:
