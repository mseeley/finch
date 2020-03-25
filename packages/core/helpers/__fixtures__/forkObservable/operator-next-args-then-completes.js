const { Observable } = require("rxjs");

module.exports = (...args) => {
  return new Observable((observer) => {
    observer.next(args);
    observer.complete();
  });
};
