/* eslint-env jest */

const EMPTY = require("./EMPTY");
const SECRET = require("./helpers/SECRET");
const localNameOf = require("./localNameOf");

describe(localNameOf(__filename), () => {
  it("returns the secret value", () => {
    expect(EMPTY()).toBe(SECRET);
  });
});
