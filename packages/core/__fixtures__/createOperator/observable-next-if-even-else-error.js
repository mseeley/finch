const { of, throwError } = require("rxjs");

module.exports = ({ value }) =>
  value % 2 === 0
    ? of(value)
    : throwError(`\`${value}\` is not an even number`);
