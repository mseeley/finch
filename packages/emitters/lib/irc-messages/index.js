const { Observable } = require("rxjs");

module.exports = ({ params, value }) => {
  return new Observable.create(subscriber => {
    try {
      // TODO
    } catch (error) {
      subscriber.error(error);
    }
  });
};
