const { Observable } = require("rxjs");

module.exports = () => {
  return new Observable(observer => {
    observer.next(process.env);
    observer.complete();
  });
};
