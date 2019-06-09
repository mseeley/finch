const createOperator = require("./createOperator");

module.exports = function createOperators(stages, context) {
  return stages.reduce((acc, stage) => {
    const factory = Array.isArray(stage) ? createOperators : createOperator;
    const observables = factory(stage, context);

    return acc.concat(observables);
  }, []);
};
