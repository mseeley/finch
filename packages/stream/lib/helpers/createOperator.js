const deepFreeze = require("deep-freeze-strict");
const cloneDeep = require("lodash.clonedeep");
const isPlainObject = require("lodash.isplainobject");
const { retryBackoff } = require("backoff-rxjs");
const { empty, defer, of } = require("rxjs");
const { mergeMap, catchError } = require("rxjs/operators");
const emptyHelper = require("../empty");
const resolveFactory = require("./resolveFactory");

const EMPTY_OR_VALUE = mergeMap(v => (v === emptyHelper() ? empty() : of(v)));
const ERROR_TO_EMPTY = catchError(error => empty());

// See: https://github.com/ReactiveX/rxjs/blob/master/doc/operator-creation.md#operator-as-a-pure-function
module.exports = function createOperator(stage) {
  const { params = {}, ...config } = stage;
  const { retryCount = 0, retryWait = 1000, continueOnError = true } = config;

  const factory = resolveFactory(config);
  const immutableParams = deepFreeze(cloneDeep(params));
  const retry =
    retryCount > 0 &&
    retryWait >= 0 &&
    retryBackoff({
      initialInterval: retryWait,
      maxRetries: retryCount
    });

  return function(source) {
    const operator = mergeMap(value => {
      const immutableValue = isPlainObject(value)
        ? deepFreeze(cloneDeep(value))
        : value;

      const payload = Object.freeze({
        value: immutableValue,
        params: immutableParams
      });

      const operators = [];

      if (retry) {
        operators.push(retry);
      }

      if (continueOnError) {
        operators.push(ERROR_TO_EMPTY);
      }

      return defer(() => factory(payload)).pipe(
        ...operators,
        EMPTY_OR_VALUE
      );
    });

    return source.pipe(operator);
  };
};
