const { toRegExp } = require("@finch/core");

module.exports = async ({ value, params }) => {
  return value.replace(toRegExp(params.pattern), params.replacement);
};
