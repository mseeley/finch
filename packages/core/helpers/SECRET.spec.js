/* eslint-env jest */

const localNameOf = require("../localNameOf");
const SECRET = require("./SECRET");

describe(localNameOf(__filename), () => {
  it("provides stable JSON serialization", () => {
    const serialized = JSON.stringify(SECRET);

    expect(JSON.parse(serialized)).toEqual(SECRET);
  });
});
