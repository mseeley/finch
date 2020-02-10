const SECRET = require("./helpers/SECRET");

// The return value of this function is provided by operators when they've
// completed their operations successfully yet have nothing to project. Streams
// clone the value object which requires a non-reference type value must be
// returned.
module.exports = function EMPTY() {
  return SECRET;
};
