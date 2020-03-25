/* eslint-env jest */

const path = require("path");
const { of } = require("rxjs");
const { take } = require("rxjs/operators");
const createOperator = require("./createOperator");
const localNameOf = require("./localNameOf");

describe(localNameOf(__filename), () => {
  function fixtures(filename) {
    return path.join(__dirname, "__fixtures__", "createOperator", filename);
  }

  it("creates a pure operator from a definition", () => {
    const definition = { use: fixtures("empty") };
    const operator = createOperator({ definition });

    expect(typeof operator).toBe("function");
  });

  it("creates a unique pure operator from a definition", () => {
    const definition = { use: fixtures("empty") };
    const operatorA = createOperator({ definition });
    const operatorB = createOperator({ definition });

    expect(operatorA).not.toBe(operatorB);
  });

  it("provides operator factory default empty params", (done) => {
    // The definition provides no parameters to the operator. The fixture
    // will resolve with the argument provided to the factory.
    const definition = {
      use: fixtures("promise-resolve-identity"),
    };
    const operator = createOperator({ definition });
    const value = 42;
    const expected = { value, params: {} };

    of(value)
      .pipe(operator)
      .subscribe((actual) => expect(actual).toEqual(expected), done.fail, done);
  });

  it("is immune to params changes after creating operator", (done) => {
    const params = { a: true, b: { c: {}, d: {} } };
    const expected = { a: true, b: { c: {}, d: {} } };
    const definition = { use: fixtures("promise-resolve-identity"), params };
    const operator = createOperator({ definition });

    // Delete a shallow property.
    delete params.a;

    // Delete a deep property.
    delete params.b.c;

    // Change a deep property
    params.b.d = false;

    // Change a shallow property
    params.a = false;

    of(undefined)
      .pipe(operator)
      .subscribe(
        (actual) => expect(actual.params).toEqual(expected),
        done.fail,
        done
      );
  });

  it("provides the operator with deep copy of params", (done) => {
    const params = { a: true, b: { c: {}, d: {} } };
    const definition = { use: fixtures("promise-resolve-identity"), params };
    const operator = createOperator({ definition });

    of(undefined)
      .pipe(operator)
      .subscribe(
        (actual) => {
          // Equivalent value not identity.
          expect(actual.params).not.toBe(params);
          expect(actual.params).toEqual(params);
        },
        done.fail,
        done
      );
  });

  it("provides operators with an immutable params object", (done) => {
    const params = { evil: false };
    const expected = { evil: false };
    const definition = {
      use: fixtures("promise-resolve-identity-mutate-params"),
      params,
    };
    const operator = createOperator({ definition });

    of(undefined)
      .pipe(operator)
      .subscribe(
        (actual) => expect(actual.params).toEqual(expected),
        done.fail,
        done
      );
  });

  it("provides operators with an immmutable value object", (done) => {
    const value = { evil: false };
    const expected = { evil: false };
    const definition = {
      use: fixtures("promise-resolve-value-mutate-value"),
    };
    const operator = createOperator({ definition });

    of(value)
      .pipe(operator)
      .subscribe((actual) => expect(actual).toEqual(expected), done.fail, done);
  });

  it("provides the operator with an immutable argument object", (done) => {
    const value = undefined;
    const params = {};
    const expected = { value, params };
    const definition = {
      use: fixtures("promise-resolve-identity-mutate-identity"),
      params,
    };
    const operator = createOperator({ definition });

    of(value)
      .pipe(operator)
      .subscribe((actual) => expect(actual).toEqual(expected), done.fail, done);
  });

  it("can create an emitter", (done) => {
    const spy = jest.fn();
    const interval = 100;
    const definition = { use: fixtures("interval"), params: { interval } };
    const operator = createOperator({ definition });

    jest.useFakeTimers();

    // An emitter ignore any input value and emits multiple values over time. It
    // does not complete.
    of(undefined)
      .pipe(operator, take(3))
      .subscribe(
        (arg) => {
          spy(arg);
          jest.advanceTimersByTime(interval);
        },
        done.fail,
        () => {
          expect(spy.mock.calls).toEqual([[0], [1], [2]]);
          done();
        }
      );

    jest.advanceTimersByTime(interval);
  });

  it("can create an operator that emits multiple values before completing", (done) => {
    const spy = jest.fn();
    const definition = {
      use: fixtures("string-split"),
      params: { glue: "," },
    };
    const operator = createOperator({ definition });

    // Accept an input value then emits 0 or more values before completing.
    of("a,b")
      .pipe(operator)
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([["a"], ["b"]]);
        done();
      });
  });

  it("can chain operators that emit multiple values", (done) => {
    const spy = jest.fn();

    of("a,b")
      .pipe(
        createOperator({
          definition: { use: fixtures("string-split"), params: { glue: "," } },
        }),
        createOperator({
          definition: {
            use: fixtures("string-concat-times"),
            params: { times: 2 },
          },
        })
      )
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([["aa"], ["aaa"], ["bb"], ["bbb"]]);
        done();
      });
  });

  it("forwards a Promise operator's return value", (done) => {
    const definition = { use: fixtures("promise-resolve") };
    const operator = createOperator({ definition });
    const value = 42;

    of(value)
      .pipe(operator)
      .subscribe((actual) => expect(actual).toBe(value), done.fail, done);
  });

  it("forwards an async/await operator's return value", (done) => {
    const definition = { use: fixtures("async-await-resolve") };
    const operator = createOperator({ definition });
    const value = 42;

    of(value)
      .pipe(operator)
      .subscribe((actual) => expect(actual).toBe(value), done.fail, done);
  });

  it("forwards an Observable operator's return value", (done) => {
    const definition = { use: fixtures("observable-next") };
    const operator = createOperator({ definition });
    const value = 42;

    of(value)
      .pipe(operator)
      .subscribe((actual) => expect(actual).toBe(value), done.fail, done);
  });

  it("swallows `empty()` return values from operators", (done) => {
    const definition = { use: fixtures("promise-resolve-if-even-else-empty") };
    const operator = createOperator({ definition });
    const spy = jest.fn();

    of(0, 1, 2, 3, 4)
      .pipe(operator)
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([[0], [2], [4]]);
        done();
      });
  });

  it("require resolved definition", () => {
    // This fixture does not need to exist for the purpose of this test.
    const definition = { include: "./does-not-exist.yaml" };

    expect(
      createOperator.bind(null, { definition })
    ).toThrowErrorMatchingInlineSnapshot(
      `"[core/createOperator] \`include: \\"./does-not-exist.yaml\\"\` must be resolved"`
    );
  });

  it("can continue without retry when a Promise operator rejects", (done) => {
    const definition = {
      use: fixtures("promise-resolve-if-even-else-reject"),
      continueOnError: true,
    };
    const operator = createOperator({ definition });
    const spy = jest.fn();

    // The operator will reject the first value and resolve the second.
    of("meaning of life", 42)
      .pipe(operator)
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toHaveLength(1);
        expect(spy.mock.calls[0]).toEqual([42]);
        done();
      });
  });

  it("can continue when an Observable operator errors", (done) => {
    const definition = {
      use: fixtures("observable-next-if-even-else-error"),
      continueOnError: true,
    };
    const operator = createOperator({ definition });
    const spy = jest.fn();

    // The operator will error the first value and next the second.
    of("meaning of life", 42)
      .pipe(operator)
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toHaveLength(1);
        expect(spy.mock.calls[0]).toEqual([42]);
        done();
      });
  });

  it("errors by default when an async operator throws", (done) => {
    const definition = { use: fixtures("async-await-throw") };
    const operator = createOperator({ definition });

    // The operator will always throw.
    of("meaning of life")
      .pipe(operator)
      .subscribe(done.fail, (error) => done());
  });

  it("errors by default when a promise operator rejects", (done) => {
    const definition = { use: fixtures("promise-resolve-if-even-else-reject") };
    const operator = createOperator({ definition });

    // The operator will reject the non-even value.
    of("meaning of life")
      .pipe(operator)
      .subscribe(done.fail, (error) => done());
  });

  it("errors if retry fails", (done) => {
    // Test with a retryWait of 0 to verify that a wait >= 0 is accepted.
    const spyPromiseResolveIfEvenElseReject = fixtures(
      "spy-promise-resolve-if-even-else-reject"
    );
    const spy = jest.fn();
    const retryCount = 2;
    const retryWait = 0;
    const definition = {
      use: spyPromiseResolveIfEvenElseReject,
      retryCount,
      retryWait,
    };
    const operator = createOperator({ definition });

    jest.useRealTimers();

    // `continueOnError` is false. The operator will retry `meaning of life`
    // twice. Afterwards the operator throw the error.
    of("meaning of life", 42)
      .pipe(operator)
      .subscribe(spy, (error) => {
        const operatorSpy = require(spyPromiseResolveIfEvenElseReject);

        expect(error.message).toEqual(
          expect.stringContaining("`meaning of life` is not an even number")
        );

        expect(operatorSpy.mock.calls).toEqual([
          // Retrying doesn't guarantee order, the source may emit new values
          // while the retry is waiting to act.
          [{ params: {}, value: "meaning of life" }],
          [{ params: {}, value: 42 }],
          [{ params: {}, value: "meaning of life" }],
          [{ params: {}, value: "meaning of life" }],
        ]);

        done();
      });
  });
});
