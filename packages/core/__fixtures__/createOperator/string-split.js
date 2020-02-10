const { Observable } = require("rxjs");

module.exports = ({ params, value }) => {
  return new Observable.create(subscriber => {
    const values = value.split(params.glue);

    values.forEach(v => subscriber.next(v));

    subscriber.complete();
  });
};
