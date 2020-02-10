const assert = require("assert");
const { retryBackoff } = require("backoff-rxjs");
const deepFreeze = require("deep-freeze-strict");
const cloneDeep = require("lodash.clonedeep");
const { identity, EMPTY, defer, of, throwError } = require("rxjs");
const { mergeMap, catchError } = require("rxjs/operators");
const emptyHelper = require("./EMPTY");
const localNameOf = require("./localNameOf");
const log = require("./log");

const localName = `[${localNameOf(__filename)}]`;

const deepFreezeClone = subject =>
  subject == null ? subject : deepFreeze(cloneDeep(subject));

// See: https://github.com/ReactiveX/rxjs/blob/master/doc/operator-creation.md#operator-as-a-pure-function
module.exports = function createOperator(options) {
  const {
    include,
    use,
    off,
    params = {},
    retryCount = 0,
    retryWait = 1000,
    continueOnError = false,
  } = options.definition;

  // Definitions which point to other definitions must be resolved separately.
  // See: `resolveStreamDefinition.js`
  assert(!include, `${localName} \`include: "${include}"\` must be resolved`);

  const factory = off ? identity : require(use);
  const immutableParams = deepFreezeClone(params);
  const retry$ =
    retryCount > 0 &&
    retryWait >= 0 &&
    retryBackoff({
      initialInterval: retryWait,
      maxRetries: retryCount,
    });

  return function(source) {
    return source.pipe(
      mergeMap(value =>
        defer(() =>
          factory(
            Object.freeze({
              value: deepFreezeClone(value),
              params: immutableParams,
            })
          )
        ).pipe(
          retry$ ? retry$ : identity,
          mergeMap(v => (v === emptyHelper() ? EMPTY : of(v))),
          catchError(error => {
            log.error(localName, "Encountered error:", error);

            if (retryCount > 0) {
              log(localName, `Retried ${retryCount} times`);
            }

            if (continueOnError) {
              log(localName, "Continuing after error");
              return EMPTY;
            } else {
              log.warn(localName, "Unrecoverable error");
              return throwError(error);
            }
          })
        )
      )
    );
  };
};
