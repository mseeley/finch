/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const { of } = require("rxjs");
const { take } = require("rxjs/operators");
const createOperator = require("./createOperator");

describe(localNameOf(__filename), () => {
  const emitters = `./__fixtures__/emitters`;
  const transmitters = `./__fixtures__/transmitters`;
  const operators = `./__fixtures__/operators`;

  const numbers = `${emitters}/numbers`;
  const stringSplit = `${transmitters}/string-split`;
  const stringConcatTimes = `${transmitters}/string-concat-times`;

  // Typical operator used for testing proper operator usage.
  const asyncAwaitResolve = `${operators}/async-await-resolve`;
  const observableNext = `${operators}/observable-next`;
  const promiseResolve = `${operators}/promise-resolve`;
  const promiseResolveIfEvenElseEmpty = `${operators}/promise-resolve-if-even-else-empty`;

  // Atypical operators used for forcing edge cases, bad behaviors, and unusual
  // return values.
  const asyncAwaitThrow = `${operators}/atypical/async-await-throw`;
  const empty = `${operators}/atypical/empty`;
  const observableNextIfEvenElseError = `${operators}/atypical/observable-next-if-even-else-error`;
  const promiseResolveIdentity = `${operators}/atypical/promise-resolve-identity`;
  const promiseResolveIdentityMutateIdentity = `${operators}/atypical/promise-resolve-identity-mutate-identity`;
  const promiseResolveIdentityMutateParams = `${operators}/atypical/promise-resolve-identity-mutate-params`;
  const promiseResolveIfEvenElseReject = `${operators}/atypical/promise-resolve-if-even-else-reject`;
  const promiseResolveValueMutateValue = `${operators}/atypical/promise-resolve-value-mutate-value`;
  const spyPromiseResolveIfEvenElseReject = `${operators}/atypical/spy-promise-resolve-if-even-else-reject`;

  it("creates a pure operator from a stage", () => {
    const stage = { use: empty };
    const operator = createOperator(stage);

    expect(typeof operator).toBe("function");
  });

  it("creates a unique pure operator from a stage", () => {
    const stage = { use: empty };
    const operatorA = createOperator(stage);
    const operatorB = createOperator(stage);

    expect(operatorA).not.toBe(operatorB);
  });

  it("provides stage factory default empty params", done => {
    // The stage provides no parameters to the operator.
    const operator = createOperator({ use: promiseResolveIdentity });
    const value = undefined;
    const expected = { value, params: {} };

    of(value)
      .pipe(operator)
      .subscribe(actual => expect(actual).toEqual(expected), done.fail, done);
  });

  it("is immune to params changes after creating operator", done => {
    const params = { a: true, b: { c: {}, d: {} } };
    const expected = { a: true, b: { c: {}, d: {} } };
    const operator = createOperator({ use: promiseResolveIdentity, params });

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
        actual => expect(actual.params).toEqual(expected),
        done.fail,
        done
      );
  });

  it("provides the operator with deep copy of params", done => {
    const params = { a: true, b: { c: {}, d: {} } };
    const operator = createOperator({ use: promiseResolveIdentity, params });

    of(undefined)
      .pipe(operator)
      .subscribe(
        actual => {
          // Equivalent value not identity.
          expect(actual.params).not.toBe(params);
          expect(actual.params).toEqual(params);
        },
        done.fail,
        done
      );
  });

  it("provides operators with an immutable params object", done => {
    const params = { evil: false };
    const expected = { evil: false };
    const operator = createOperator({
      use: promiseResolveIdentityMutateParams,
      params
    });

    of(undefined)
      .pipe(operator)
      .subscribe(
        actual => expect(actual.params).toEqual(expected),
        done.fail,
        done
      );
  });

  it("provides operators with an immmutable value object", done => {
    const value = { evil: false };
    const expected = { evil: false };
    const operator = createOperator({ use: promiseResolveValueMutateValue });

    of(value)
      .pipe(operator)
      .subscribe(actual => expect(actual).toEqual(expected), done.fail, done);
  });

  it("provides the operator with an immutable argument object", done => {
    const value = undefined;
    const params = {};
    const expected = { value, params };
    const operator = createOperator({
      use: promiseResolveIdentityMutateIdentity,
      params
    });

    of(value)
      .pipe(operator)
      .subscribe(actual => expect(actual).toEqual(expected), done.fail, done);
  });

  it("can create an emitter", done => {
    const spy = jest.fn();
    const interval = 100;
    const operator = createOperator({ use: numbers, params: { interval } });

    jest.useFakeTimers();

    // An emitter ignore any input value and emits multiple values over time. It
    // does not complete.
    of(undefined)
      .pipe(
        operator,
        take(3)
      )
      .subscribe(
        arg => {
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

  it("can create a transmitter", done => {
    const spy = jest.fn();
    const operator = createOperator({
      use: stringSplit,
      params: { glue: "," }
    });

    // A transmitter accepts an input value then emits 0 or more values before
    // completing.
    of("a,b")
      .pipe(operator)
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([["a"], ["b"]]);
        done();
      });
  });

  it("can chain transmitters", done => {
    const spy = jest.fn();

    // Not a recommended use case as it can lead to confusing streams but the
    // use case is well supported by the API.
    of("a,b")
      .pipe(
        createOperator({ use: stringSplit, params: { glue: "," } }),
        createOperator({ use: stringConcatTimes, params: { times: 2 } })
      )
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([["aa"], ["aaa"], ["bb"], ["bbb"]]);
        done();
      });
  });

  it("forwards a Promise stage's return value", done => {
    const operator = createOperator({ use: promiseResolve });
    const value = 42;

    of(value)
      .pipe(operator)
      .subscribe(actual => expect(actual).toBe(value), done.fail, done);
  });

  it("forwards an async/await stage's return value", done => {
    const operator = createOperator({ use: asyncAwaitResolve });
    const value = 42;

    of(value)
      .pipe(operator)
      .subscribe(actual => expect(actual).toBe(value), done.fail, done);
  });

  it("forwards an Observable stage's return value", done => {
    const operator = createOperator({ use: observableNext });
    const value = 42;

    of(value)
      .pipe(operator)
      .subscribe(actual => expect(actual).toBe(value), done.fail, done);
  });

  it("swallows `empty()` return values from operators", done => {
    const operator = createOperator({ use: promiseResolveIfEvenElseEmpty });
    const spy = jest.fn();

    of(0, 1, 2, 3, 4)
      .pipe(operator)
      .subscribe(spy, done.fail, () => {
        expect(spy.mock.calls).toEqual([[0], [2], [4]]);
        done();
      });
  });

  it("can continue without retry when a Promise stage rejects", done => {
    const operator = createOperator({ use: promiseResolveIfEvenElseReject });
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

  it("can continue when an Observable stage errors", done => {
    const operator = createOperator({ use: observableNextIfEvenElseError });
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

  it("errors when an async stage throws and continueOnError: false", done => {
    const operator = createOperator({
      use: asyncAwaitThrow,
      continueOnError: false
    });

    // The operator will always throw.
    of("meaning of life")
      .pipe(operator)
      .subscribe(done.fail, error => done());
  });

  it("errors when a stage rejects and continueOnError: false", done => {
    const operator = createOperator({
      use: promiseResolveIfEvenElseReject,
      continueOnError: false
    });

    // The operator will reject the non-even value.
    of("meaning of life")
      .pipe(operator)
      .subscribe(done.fail, error => done());
  });

  it("retries multiple times over time", done => {
    // Test with a retryWait of 0 to verify that a wait >= 0 is accepted.
    const spy = jest.fn();
    const retryCount = 2;
    const retryWait = 0;
    const operator = createOperator({
      use: spyPromiseResolveIfEvenElseReject,
      retryCount,
      retryWait
    });

    jest.useRealTimers();

    of("meaning of life", 42)
      .pipe(operator)
      .subscribe(spy, done.fail, () => {
        const operatorSpy = require(spyPromiseResolveIfEvenElseReject);

        expect(operatorSpy.mock.calls).toEqual([
          // Retrying doesn't guarantee order, new values may be provided to the
          // operator while the retry is waiting to act.
          [{ params: {}, value: "meaning of life" }],
          [{ params: {}, value: 42 }],
          [{ params: {}, value: "meaning of life" }],
          [{ params: {}, value: "meaning of life" }]
        ]);

        done();
      });
  });
});
