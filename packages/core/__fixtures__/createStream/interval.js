const { interval } = require("rxjs");

module.exports = ({ params }) => {
  const { interval: intervalMs = 10 } = params;

  return interval(intervalMs);
};
