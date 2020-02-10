module.exports = ({ value, params }) => {
  // Assume that value is an object. Resolve with a mutated input value.
  params.evil = true;
  params.villian = { level: 99 };

  return Promise.resolve(value);
};
