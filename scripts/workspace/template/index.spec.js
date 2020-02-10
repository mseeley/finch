/* eslint-env jest */

const { localNameOf } = require("@finch/core");

describe(localNameOf(__filename), () => {
  it.todo(`hello world from ${localNameOf(__filename)}`);
});
