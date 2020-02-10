module.exports = async ({ value, params }) => {
  // An error throw here causes the returned promise to be rejected.
  return JSON.stringify(value, params.replacer, params.space);
};
