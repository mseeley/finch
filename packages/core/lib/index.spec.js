/* eslint-env jest */
const localNameOf = require("./localNameOf");
const index = require("./index");

const expected = ["localNameOf"];

describe(localNameOf(__filename), () => {
  it("exports only expected members", () => {
    expect(Object.keys(index).sort()).toEqual(expected.sort());
  });
});
