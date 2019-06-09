const { of } = require("rxjs");
const deepFreeze = require("deep-freeze-strict");
const cloneDeep = require("lodash.clonedeep");
const createOperators = require("./helpers/createOperators");

module.exports = function createStream(stages, context = {}) {
  // A single immutable context object is shared by all stages.
  const immutableContext = deepFreeze(cloneDeep(context));
  const observables = createOperators(stages, immutableContext);

  return of(undefined).pipe(...observables);
};
