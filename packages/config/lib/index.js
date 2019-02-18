"use strict";

const logger = require("@finch/logger")(__filename);
const watchOne = require("./watchOne");
const watchMany = require("./watchMany");

function withLogger(fn) {
  const wrapped = (params = {}) =>
    params.logger ? fn(params) : fn({ logger, ...params });

  wrapped.original = fn;

  return wrapped;
}

exports.watchOne = withLogger(watchOne);
exports.watchMany = withLogger(watchMany);
