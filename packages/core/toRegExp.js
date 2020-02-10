const expression = /\/(.*)\/(.*)/;

module.exports = function toRegExp(pattern) {
  // Throws when `pattern` doesn't correctly convert.
  return new RegExp(...pattern.match(expression).slice(1));
};
