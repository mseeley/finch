/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const { take } = require("rxjs/operators");
const values = require("./index");

describe(localNameOf(__filename), () => {
  let subscriber;

  const iterableTests = [
    [
      [4, 2],
      [[4], [2]],
    ],
    ["42", [["4"], ["2"]]],
    [new Set([4, 2]), [[4], [2]]],
    [
      new Map([
        [4, "four"],
        [2, "two"],
      ]),
      [[[4, "four"]], [[2, "two"]]],
    ],
  ];

  const nonIterableTests = [
    [null, [null]],
    [undefined, [undefined]],
    [true, [true]],
    [false, [false]],
    [42, [42]],
  ];

  afterEach(() => {
    if (subscriber && !subscriber.closed) {
      subscriber.unsubscribe();
      subscriber = null;
    }
  });

  test.each(iterableTests)(
    "emits iterable values over time",
    (input, expected, done) => {
      const spy = jest.fn(() => {});

      subscriber = values({
        params: { values: input, delay: 50 },
      }).subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual(expected);
        done();
      });
    }
  );

  test.each(iterableTests)(
    "emits iterable values without delay",
    (input, expected, done) => {
      const spy = jest.fn(() => {});

      subscriber = values({ params: { values: input } }).subscribe(
        spy,
        done.fail,
        () => {
          expect(spy.mock.calls).toEqual(expected);
          done();
        }
      );
    }
  );

  test.each(nonIterableTests)(
    "errors when `values` is not iterable",
    (input, expected, done) => {
      subscriber = values({ params: { values: input } }).subscribe(
        done.fail,
        (error) => {
          expect(error.message).toEqual(
            expect.stringMatching("is not iterable")
          );
          done();
        }
      );
    }
  );

  it("runs once by default", (done) => {
    const spy = jest.fn(() => {});
    const expected = [["4"], ["2"]];

    subscriber = values({ params: { values: "42" } }).subscribe(
      spy,
      done.fail,
      () => {
        expect(spy.mock.calls).toEqual(expected);
        done();
      }
    );
  });

  it("runs N times", (done) => {
    const spy = jest.fn(() => {});
    const expected = [["4"], ["2"], ["4"], ["2"], ["4"], ["2"]];

    subscriber = values({ params: { values: "42", times: 3 } }).subscribe(
      spy,
      done.fail,
      () => {
        expect(spy.mock.calls).toEqual(expected);
        done();
      }
    );
  });

  it("runs indefinitely", (done) => {
    const spy = jest.fn(() => {});
    const expected = [["4"], ["2"], ["4"], ["2"], ["4"]];
    const taken = expected.length;

    subscriber = values({ params: { values: "42", times: -1 } })
      .pipe(take(taken))
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual(expected);
        done();
      });
  });

  // Uncomment this test as necessary. See comments in `index.js` for context.

  // it("avoids exceeding callstack", done => {
  //   const maxCallstackSize = (function computeMaxCallStackSize() {
  //     // See: https://2ality.com/2014/04/call-stack-size.html
  //     try {
  //       return 1 + computeMaxCallStackSize();
  //     } catch (e) {
  //       return 1;
  //     }
  //   })();
  //   const spy = jest.fn(() => {});
  //   const taken = maxCallstackSize * 2;

  //   subscriber = values({ params: { values: [0], times: -1 } })
  //     .pipe(take(taken))
  //     .subscribe(
  //       spy,
  //       // The recursion limit is reached within RxJS, we cannot catch it.
  //       done.fail,
  //       () => {
  //         expect(spy.mock.calls).toHaveLength(taken);
  //         done();
  //       }
  //     );
  // }, 60000);
});
