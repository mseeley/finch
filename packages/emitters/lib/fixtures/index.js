const { interval } = require("rxjs");
const { map } = require("rxjs/operators");

module.exports = ({ params }) => {
  const { fixture, interval: intervalMs = 1000 } = params;

  return interval(intervalMs).pipe(
    map(i => (fixture === undefined ? i : fixture))
  );
};
