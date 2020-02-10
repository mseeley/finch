/* eslint-env jest */

const EMPTY = require("./EMPTY");
const createStream = require("./createStream");
const createStreamFromPath = require("./createStreamFromPath");
const localNameOf = require("./localNameOf");
const toRegExp = require("./toRegExp");
const watchFiles = require("./watchFiles");
const core = require("./index");

describe(localNameOf(__filename), () => {
  it("exports expected members", () => {
    expect(core).toEqual({
      createStream,
      createStreamFromPath,
      EMPTY,
      localNameOf,
      toRegExp,
      watchFiles,
    });
  });
});
