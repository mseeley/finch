/* eslint-env jest */

const localNameOf = require("./localNameOf");

describe(localNameOf(__filename), () => {
  it("translates a filename into a packages directory relative value", () => {
    const filename =
      "/Users/matthome/Development/finch/packages/core/helpers/readFile.js";

    expect(localNameOf(filename)).toEqual("core/helpers/readFile");
  });

  it("translates a filename into a scope directory relative value", () => {
    const filename =
      "/Users/matthome/finch/node_modules/@finch/core/helpers/readFile.js";
    expect(localNameOf(filename)).toEqual("core/helpers/readFile");
  });
});
