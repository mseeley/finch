/* eslint-env jest */
const { localNameOf } = require("@finch/core");
const index = require("./index");

const expected = ["fixtures"];

describe(localNameOf(__filename), () => {
  it("exports only expected members", () => {
    expect(Object.keys(index).sort()).toEqual(expected.sort());
  });
});
