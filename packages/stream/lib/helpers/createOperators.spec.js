/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const createOperators = require("./createOperators");

describe(localNameOf(__filename), () => {
  const use = "./__fixtures__/operators/atypical/empty";

  it("returns nested stages as flat array of operators", () => {
    // The actual stagrs are unimportant, focus on the return structure.
    const stages = [{ use }, [{ use }, [{ use }]]];
    const operators = createOperators(stages);

    expect(operators).toMatchSnapshot();
  });
});
