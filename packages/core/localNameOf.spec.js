/* eslint-env jest */

const localNameOf = require("./localNameOf");

describe(localNameOf(__filename), () => {
  it("translates a filename into a packages directory relative value", () => {
    expect(localNameOf(__filename)).toEqual("core/localNameOf.spec");
  });
});
