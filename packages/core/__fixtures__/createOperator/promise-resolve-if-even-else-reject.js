module.exports = ({ value }) =>
  value % 2 === 0
    ? Promise.resolve(value)
    : Promise.reject(new Error(`\`${value}\` is not an even number`));
