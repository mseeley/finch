"use strict";

const assert = require("assert");
const path = require("path");
const watchMany = require("./watchMany");

module.exports = function watchOne({ filename, logger }) {
  assert(path.isAbsolute(filename), `"${filename}" is not an absolute path`);

  return watchMany({
    dirname: path.dirname(filename),
    glob: path.basename(filename),
    logger,
  });
};
