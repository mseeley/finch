/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const { createExportAliasSpecs } = require("@finch/core-tools");

describe(localNameOf(__filename), () => {
  createExportAliasSpecs({
    exportDirectory: __dirname
  });
});
