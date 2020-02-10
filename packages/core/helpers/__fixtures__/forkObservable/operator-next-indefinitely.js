const { interval } = require("rxjs");

module.exports = () => {
  return interval(10);
};
