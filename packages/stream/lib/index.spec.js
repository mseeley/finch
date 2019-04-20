/* eslint-env jest */
const { localNameOf } = require("@finch/core");
const index = require("./index");

const expected = ["createStream", "empty", "validateStream"];

describe(localNameOf(__filename), () => {
  it("exports only expected members", () => {
    expect(Object.keys(index).sort()).toEqual(expected.sort());
  });
});
