/* eslint-env jest */

const path = require("path");
const { take } = require("rxjs/operators");
const localNameOf = require("../localNameOf");
const forkObservable = require("./forkObservable");

describe(localNameOf(__filename), () => {
  function fixtures(file = "") {
    return path.join(__dirname, "__fixtures__", "forkObservable", `${file}.js`);
  }

  function reject(error) {
    throw error || new Error("Intentional but unspecified error");
  }

  let subscriber;

  afterEach(() => {
    if (subscriber && !subscriber.closed) {
      subscriber.unsubscribe();
      subscriber = null;
    }
  });

  describe("observable factory error handling", () => {
    it("emits unhandled subprocess factory runtime exception", (done) => {
      subscriber = forkObservable({
        factory: fixtures("unhandled-exception-factory"),
      }).subscribe(
        reject,
        (error) => {
          expect(error && error.message).toBe("Error: Intentional error");
          done();
        },
        reject
      );
    });

    it("emits unhandled subprocess factory parsing exception", (done) => {
      subscriber = forkObservable({
        factory: fixtures("unhandled-exception-parse"),
      }).subscribe(
        reject,
        (error) => {
          expect(error && error.message).toBe("Error: Intentional error");
          done();
        },
        reject
      );
    });

    it("emits exception when factory cannot be found", (done) => {
      const factory = "i-do-not-exist";

      subscriber = forkObservable({ factory }).subscribe(
        reject,
        (error) => {
          expect(error && error.message).toEqual(
            expect.stringContaining(`Cannot find module '${factory}'`)
          );
          done();
        },
        reject
      );
    });
  });

  describe("subprocess observable behaviors", () => {
    it("supports observables that never next before complete", (done) => {
      subscriber = forkObservable({
        factory: fixtures("operator-completes-without-next"),
      }).subscribe(reject, reject, () => {
        // No need to assert. The test will fail immediately if the observable
        // nexts or errors. It will fail after a delay if the observable never
        // completes causing `done()` to never execute.
        done();
      });
    });

    it("supports observables that next once then complete", (done) => {
      let i;

      subscriber = forkObservable({
        factory: fixtures("operator-next-once-then-complete"),
      }).subscribe(
        (value) => {
          i = value;
        },
        reject,
        () => {
          expect(i).toBe(42);
          done();
        }
      );
    });

    it("supports observables that next indefinitely", (done) => {
      const taken = 5;
      const spy = jest.fn();

      subscriber = forkObservable({
        factory: fixtures("operator-next-indefinitely"),
      })
        .pipe(take(taken))
        .subscribe(spy, reject, () => {
          expect(spy).toHaveBeenCalledTimes(taken);
          done();
        });
    });

    it("supports observables that immediately emit an error", (done) => {
      subscriber = forkObservable({
        factory: fixtures("operator-errors"),
      }).subscribe(
        reject,
        (error) => {
          expect(error && error.message).toBe("Error: Intentional error");
          done();
        },
        reject
      );
    });

    it("provides args to observable factory", (done) => {
      const args = [42, "unicorn", true];

      expect.assertions(1);

      subscriber = forkObservable({
        factory: fixtures("operator-next-args-then-completes"),
        args,
      }).subscribe(
        (value) => {
          expect(value).toEqual(args);
        },
        reject,
        done
      );
    });

    it("provides default args to observable factory", (done) => {
      expect.assertions(1);

      subscriber = forkObservable({
        factory: fixtures("operator-next-args-then-completes"),
      }).subscribe(
        (value) => {
          expect(value).toEqual([]);
        },
        reject,
        done
      );
    });
  });

  describe("subprocess handling", () => {
    const key = `FINCH_SPEC_${Date.now()}`;
    const value = "42";

    it("provides process options to subprocess", (done) => {
      subscriber = forkObservable({
        factory: fixtures("operator-next-env-then-completes"),
        // There are more options available. This spec only tests against
        // process.env.
        options: { env: { [key]: value } },
      }).subscribe(
        (result) => {
          // The operator nexts with the value of process.env. The key/value set
          // above should be included.
          expect(result[key]).toBe(value);
        },
        reject,
        done
      );
    });

    it("completes the master observable when child exits prematurely", (done) => {
      // No need to assert. The test will fail immediately if the observable
      // nexts or errors. It will fail after a delay if the observable never
      // completes causing `done()` to never execute.
      subscriber = forkObservable({
        factory: fixtures("process-exit-empty"),
      }).subscribe(reject, reject, done);
    });

    it("errors the master observable when child exits with error", (done) => {
      // The test will fail immediately if the observable nexts or errors.
      subscriber = forkObservable({
        factory: fixtures("process-exit-one"),
      }).subscribe(
        reject,
        (error) => {
          expect(error.message).toBe("Error: Fatal error in process, code: 1");
          done();
        },
        reject
      );
    });
  });

  describe("subprocess teardown (within master)", () => {
    const ioc = {
      fork: jest.fn((...args) => {
        const subprocess = require("child_process").fork(...args);
        jest.spyOn(subprocess, "disconnect");
        return subprocess;
      }),
    };

    it("master disconnects from subprocess when it completes before subprocess", (done) => {
      subscriber = forkObservable(
        { factory: fixtures("operator-next-indefinitely") },
        ioc
      )
        .pipe(take(1))
        .subscribe(null, reject, () => {
          const subprocess = ioc.fork.mock.results[0].value;

          // The forkObservable's cleanup unsubscribe is invoked after this
          // onComplete.
          process.nextTick(() => {
            expect(subprocess.disconnect).toHaveBeenCalled();
            done();
          });
        });
    });
  });
});
