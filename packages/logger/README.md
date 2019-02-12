# @finch/logger

This is the default logger used by `@finch` packages. It is an intentionally simple logger that outputs only to the console. The expectation is that `@finch` consumers provide a more robust logger of their own.

## Usage

```js
const logger = require("@finch/logger")({ prefix: "My prefix"});

logger.info("My message);

// Logs to console:
// 2019-02-12T05:57:52.383Z [My prefix] info: My message
```

## Known issues

- Passing multiple parameters to logging functions doesn't behave as expected [#1427](https://github.com/winstonjs/winston/issues/1427)
