module.exports = ({ value }) =>
  value % 2 === 0
    ? Promise.resolve(value)
    : Promise.reject(`\`${value}\` is not an even number`);
