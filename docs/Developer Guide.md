# Developer Guide

This document explains some of the global setup and tooling. Each package may
have its own additional setup and tooling.

## Setup

Finch always uses the latest Node.js LTS version. Issues running against older
Node.js versions are immediately closed. Issues running against newer Node.js
versions are addressed as time permits.

Node Version Manager (NVM) is used ensure the application is developed against a
known Node.js version. Begin by [setting up
NVM](https://github.com/creationix/nvm). Next follow NVM's onscreen directions:

```
nvm use
```

Install and hoist the package dependencies.

```
yarn
```

See the packages themselves for other setup instructions.

## Tooling

General tooling instructions follow below. Refer to these other documents for
other specific tooling use cases:

- [Workspace Guide](Workspace%20Guide.md)

### Specs

Execute all specs (unit tests) defined in `.spec.js` files using Jest. See [Jest API documentation](https://jestjs.io/docs/en/api) for information on authoring tests.

```
yarn test
```

Test specs for a specific package workspace:

```
yarn test packages/{workspace}/
```

Jest arguments can be passed to `yarn test` as seen below:

```
yarn test --watch
```

Use the Node.js debugger to step through specs.

```
yarn test:debug
```

> _Avoid the `--watch` Jest behavior when using `test:debug`. As of Jest 24 it doesn't work consistently with debugging._

Modules can support spec-specific behavior by using the snippet below:

```js
if (process.env.NODE_ENV === "test") {
  // This condition is only met while within Jest's runner.
}
```

### Lint

Lint and fix source files:

```
yarn lint
```

Linting and code style are strictly enforced. [Prettier](https://prettier.io) is
used to format all project files. Pre-commit hooks lint and fix `.js`,
`.html`, and `.md` files. Please configure your editor to provide lint feedback
while editing and formatting on save.

See the packages themselves for other tooling instructions.

## Debugging tips

### Spec debugging

Unfortunately Jest `--watch` is frustratingly inconsistent when the debugger is involved. This workaround is less graceful but functional.

The following is tested on macOS:

1. Install the [Chrome NiM plugin](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj)
1. Configure the plugin to automatically open devtools
1. Place a `debugger` statement where you would like to begin debugging
1. Run `yarn test:debug`
1. Click in the Chrome window, NiM should open devtools
1. Allow the debugger to continue (use `Meta+\` shortcut on macOS)
1. The debugger should stop at the `debugger` statement from above
1. Perform your debugging, breakpoints are maintained between runs
1. To run again press `Ctrl+C` from the Jest terminal to break the debugger connection
1. Make your code changes
1. Re-run `yarn test:debug`
1. Click back into the Chrome window, NiM should re-open devtools
1. Repeat
