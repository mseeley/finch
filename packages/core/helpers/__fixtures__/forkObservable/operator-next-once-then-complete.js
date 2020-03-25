const { Observable } = require("rxjs");

module.exports = () => {
  return new Observable((observer) => {
    observer.next(42);
    observer.complete();
  });
};
