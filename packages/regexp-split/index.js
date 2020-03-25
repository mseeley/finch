const { toRegExp } = require("@finch/core");
const { Observable } = require("rxjs");

module.exports = ({ value, params }) => {
  const { pattern } = params;

  return new Observable((observer) => {
    try {
      const values = value.split(toRegExp(pattern));

      let i = 0;

      // Stop emitting values if the observer intercepted an unhandled error
      // or the observer was completed. The observer won't next its subscribers
      // but it's avoidable work.
      while (!observer.closed && !observer.isStopped && i < values.length) {
        const v = values[i++];

        observer.next(v);
      }

      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  });
};
