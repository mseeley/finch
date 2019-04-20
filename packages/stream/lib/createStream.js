const { of } = require("rxjs");
const createOperators = require("./helpers/createOperators");

module.exports = function createStream(stages) {
  const observables = createOperators(stages);

  return of(undefined).pipe(...observables);
};
