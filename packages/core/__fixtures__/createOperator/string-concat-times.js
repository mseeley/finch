const { Observable } = require("rxjs");

module.exports = ({ params, value }) => {
  return new Observable.create((subscriber) => {
    let nextValue = value;

    for (let i = 0; i < params.times; i++) {
      subscriber.next((nextValue += value));
    }

    subscriber.complete();
  });
};
