const { interval } = require("rxjs");

module.exports = ({ params }) => {
  const { interval: intervalMs = 100 } = params;

  return interval(intervalMs);
};
