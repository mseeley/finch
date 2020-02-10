const { EMPTY, toRegExp } = require("@finch/core");

module.exports = async ({ value, params }) => {
  const all = params.all || [];
  const any = params.any || [];
  const test = pattern_ => toRegExp(pattern_).test(value);

  let matches = false;

  // TODO: Log when pattern is used with any or all. The latter two are ignored.

  if (params.pattern) {
    matches = test(params.pattern);
  } else if (any.length && all.length) {
    matches = any.some(test) && all.every(test);
  } else if (any.length) {
    matches = any.some(test);
  } else if (all.length) {
    matches = all.every(test);
  }

  return matches ? value : EMPTY();
};
