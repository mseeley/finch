const { EMPTY } = require("rxjs");

throw new Error("Intentional error");

// eslint-disable-next-line no-unreachable
module.exports = () => {
  return EMPTY;
};
