const { of } = require("rxjs");
const createOperator = require("./createOperator");

module.exports = function createOperators(options) {
  const operators = options.definitions.map(definition =>
    createOperator({ definition })
  );

  return of(undefined).pipe(...operators);
};
