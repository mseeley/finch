module.exports = async ({ value, params }) =>
  value.replace(params.pattern, params.replacement);
