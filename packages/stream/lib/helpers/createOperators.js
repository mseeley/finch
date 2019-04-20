const createOperator = require("./createOperator");

module.exports = function createOperators(stages) {
  return stages.reduce((acc, stage) => {
    const factory = Array.isArray(stage) ? createOperators : createOperator;
    const observables = factory(stage);

    return acc.concat(observables);
  }, []);
};
