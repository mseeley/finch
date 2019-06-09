"use strict";

const assert = require("assert");
const { empty } = require("@finch/stream");

function toArray(regexp) {
  if (Array.isArray(regexp)) {
    return regexp;
  }

  return regexp ? [regexp] : [];
}

function testValue(value, regexp) {
  return regexp.test(value);
}

module.exports = async ({ value, params }) => {
  const all = toArray(params.all);
  const any = toArray(params.any);

  assert(all.length || any.length, "regexp-blacklist requires `all` or `any`");

  assert(
    all.every(r => r instanceof RegExp),
    "regexp-blacklist `all` only supports regular expressions"
  );

  assert(
    any.every(r => r instanceof RegExp),
    "regexp-blacklist `any` only supports regular expressions"
  );

  assert(
    typeof value === "string",
    "regexp-blacklist called with a non-string value"
  );

  const test = testValue.bind(null, value);

  let matches = false;

  if (any.length && all.length) {
    matches = any.some(test) && all.every(test);
  } else if (any.length) {
    matches = any.some(test);
  } else if (all.length) {
    matches = all.every(test);
  }

  return matches ? empty() : value;
};
