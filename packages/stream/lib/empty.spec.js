/* eslint-env jest */
const { localNameOf } = require("@finch/core");
const empty = require("./empty");

describe(localNameOf(__filename), () => {
  it("returns the secret value", () => {
    expect(typeof empty.__secret__).toBe("string");
    expect(empty.__secret__.length).toBe(64);
    expect(empty()).toBe(empty.__secret__);
  });
});
