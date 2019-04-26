/* eslint-env jest */

const { take } = require("rxjs/operators");
const { localNameOf } = require("@finch/core");
const fixture = require("./index");

describe(localNameOf(__filename), () => {
  const defaultInterval = 1000;
  const customInterval = 100;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  it("emits numbers over time at a default 1s interval", done => {
    const spy = jest.fn(() => {
      jest.advanceTimersByTime(defaultInterval);
    });

    fixture({ params: {} })
      .pipe(take(3))
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([[0], [1], [2]]);
        done();
      });

    jest.advanceTimersByTime(defaultInterval);
  });

  it("emits numbers over time", done => {
    const spy = jest.fn(() => {
      jest.advanceTimersByTime(customInterval);
    });

    fixture({ params: { interval: customInterval } })
      .pipe(take(3))
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([[0], [1], [2]]);
        done();
      });

    jest.advanceTimersByTime(customInterval);
  });

  it("emits a fixed value over time", done => {
    const spy = jest.fn(() => {
      jest.advanceTimersByTime(customInterval);
    });

    fixture({ params: { fixture: 42, interval: customInterval } })
      .pipe(take(3))
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([[42], [42], [42]]);
        done();
      });

    jest.advanceTimersByTime(customInterval);
  });
});
