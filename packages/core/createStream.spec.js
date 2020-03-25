/* eslint-env jest */

const path = require("path");
const fs = require("fs-extra");
const { reduce, take } = require("rxjs/operators");
const tmp = require("tmp");
const {
  copyToUniqueTmpDir,
  once,
  wait,
  stabilityThreshold,
  superGenerousStabilityThreshold,
  touch,
} = require("./__fixtures__/helpers");
const createStream = require("./createStream");
const localNameOf = require("./localNameOf");

describe(localNameOf(__filename), () => {
  function fixtures(filename) {
    return path.join(__dirname, "__fixtures__", "createStream", filename);
  }

  function relative(filename) {
    // `path.relative` and `path.join` omit the `./`.
    return `.${path.sep}${path.relative(__dirname, fixtures(filename))}`;
  }

  let subscriber;
  let env;

  beforeAll(() => {
    env = process.env;

    tmp.setGracefulCleanup();
  });

  beforeEach(() => {
    process.env = {
      ...process.env,
      FINCH_STABILITY_THRESHOLD: String(stabilityThreshold),
    };
  });

  afterEach(() => {
    process.env = env;

    if (subscriber && !subscriber.closed) {
      subscriber.unsubscribe();
      subscriber = null;
    }
  });

  describe("when resolving stream definitions", () => {
    it("resolves stream definition before executing", (done) => {
      const definitions = [
        { use: "@finch/values", params: { values: [0, 1, 2] } },
        // Use relative paths for fixtures so that `resolveFrom` is exercised.
        // Uses separate operators to multiply each value by 10 then invert the
        // product.
        { include: relative("multiply-by-10-then-invert.json") },
      ];

      subscriber = createStream({
        definitions,
        resolveFrom: __dirname,
      })
        .pipe(
          reduce((acc, v) => acc.concat(v), []),
          take(1)
        )
        .subscribe(
          (actual) => {
            expect(actual).toEqual([0, -10, -20]);
          },
          done.fail,
          done
        );
    });

    it("re-resolves stream definition after dependency change while watching", async (done) => {
      // Two operators are copied to the tmp dir.
      const [multiplyBy10, invert] = await copyToUniqueTmpDir([
        fixtures("multiply-by-10.js"),
        fixtures("invert.js"),
      ]);

      // Then an include.json is written to the tmp dir. Its contents will be
      // manipulated to use one of the copied operators at a time. Its content
      // update will trigger the stream to re-run.
      const include = path.join(path.dirname(multiplyBy10), "include.json");

      const definitions = [
        { use: "@finch/values", params: { values: [1] } },
        { include },
      ];

      const rewriteIncludeOnce = once(() => {
        fs.writeFile(include, JSON.stringify({ use: invert }));
      });

      // The first value is from multiply-by-10, the second from invert.
      const expected = [10, -1];
      const assertions = expected.length;

      expect.assertions(assertions);

      await fs.writeFile(include, JSON.stringify({ use: multiplyBy10 }));

      subscriber = createStream({ definitions, shouldWatch: true })
        .pipe(take(assertions))
        .subscribe(
          (value) => {
            expect(value).toEqual(expected.shift());
            rewriteIncludeOnce();
          },
          done.fail,
          done
        );
    });

    it("errors when stream definition resolution fails", (done) => {
      // Stream resolution can fail for a variety of reasons. This failure is
      // do to the operator definition not existing.
      subscriber = createStream({
        definitions: [{ use: relative("i-do-not-exist") }],
      }).subscribe(null, (error) => {
        expect(error).toMatchInlineSnapshot(
          `[Error: [core/resolveStreamDefinition]: {"use":"./__fixtures__/createStream/i-do-not-exist"} is invalid: cannot find ./__fixtures__/createStream/i-do-not-exist]`
        );
        done();
      });
    });

    it("errors when stream definition resolution fails after a dependency changes while watching", async (done) => {
      // Stream re-resolution fails. When the include dependency is updated in a
      // way that fails validation.
      const [commonOperators] = await copyToUniqueTmpDir([
        fixtures("multiply-by-10-then-invert.json"),
        fixtures("multiply-by-10.js"),
        fixtures("invert.js"),
      ]);

      const makeCommonOperatorsInvalidOnce = once(() => {
        // readJSON returns a `null` value after reading an empty file. This in
        // turn fails validation.
        fs.writeFile(commonOperators, "");
      });

      const definitions = [
        { use: "@finch/values", params: { values: [1] } },
        { include: commonOperators },
      ];

      // The stream is expected to yield one value. After that value is emitted
      // a dependency is tainted such that the stream will error.
      expect.assertions(2);

      subscriber = createStream({ definitions, shouldWatch: true }).subscribe(
        (value) => {
          expect(value).toBe(-10);

          makeCommonOperatorsInvalidOnce();
        },
        (error) => {
          expect(error).toMatchInlineSnapshot(
            `[Error: [core/resolveStreamDefinition]: null is invalid: {"pointer":"","errors":["should be object"]}]`
          );

          done();
        }
      );
    });
  });

  describe("when running stream", () => {
    it("completes without emitting values when there are no definitions", (done) => {
      const definitions = [];

      subscriber = createStream({ definitions }).subscribe(
        done.fail,
        done.fail,
        done
      );
    });

    it("completes without emitting values when dependencies resolve to no definitions", (done) => {
      const definitions = [{ include: fixtures("empty.json") }];

      subscriber = createStream({ definitions }).subscribe(
        done.fail,
        done.fail,
        done
      );
    });

    it("emits no values and waits for dependency change when stream has no definitions but has dependencies and watching", async (done) => {
      const [emptyJSON] = await copyToUniqueTmpDir([
        fixtures("empty.json"),
        fixtures("resolve.js"),
      ]);

      const definitions = [{ include: emptyJSON }];
      const onNext = jest.fn();
      const times = 1;

      subscriber = createStream({ definitions, shouldWatch: true })
        .pipe(take(1))
        .subscribe(onNext, done.fail, () => {
          expect(onNext).toHaveBeenCalledTimes(times);
          expect(onNext).toHaveBeenLastCalledWith(42);
          done();
        });

      await wait(superGenerousStabilityThreshold);

      await fs.writeJSON(emptyJSON, [
        { use: "./resolve.js", params: { message: 42 } },
      ]);
    });

    it("runs stream in a separate process", (done) => {
      const definitions = [{ use: fixtures("resolve-process-pid") }];

      expect.assertions(2);

      subscriber = createStream({ definitions }).subscribe(
        (pid) => {
          expect(pid).toBeGreaterThan(0);
          expect(pid).not.toBe(process.pid);
        },
        done.fail,
        done
      );
    });

    it("process.env changes ignored by running stream", async (done) => {
      const now = String(Date.now());
      const name = `FINCH_${now}`;

      // The first operator is an interval that keeps the stream alive. The
      // second operator then returns a process.env member name each time the
      // first operator yields a value.
      const definitions = [
        { use: fixtures("interval.js") },
        { use: fixtures("resolve-process-env.js"), params: { name } },
      ];

      // The process.env member is changed between each tests. The stream should
      // continue to return the initial process.env member value.
      const assertions = 2;

      process.env[name] = String(now);

      expect.assertions(assertions);

      subscriber = createStream({ definitions })
        .pipe(take(assertions))
        .subscribe(
          (envValue) => {
            expect(envValue).toBe(now);
            process.env[name] = String(Date.now());
          },
          done.fail,
          done
        );
    });

    it("restarting a stream forwards current process.env when watching", async (done) => {
      const [resolveProcessEnv] = await copyToUniqueTmpDir([
        fixtures("resolve-process-env.js"),
      ]);

      const touchResolveProcessEnvOnce = once(() => {
        touch(resolveProcessEnv);
      });

      const name = `FINCH_${Date.now()}`;
      const definitions = [{ use: resolveProcessEnv, params: { name } }];

      // Expect an immediate assertion then another after the dependency is
      // touched.
      const assertions = 2;

      let expected = String(Date.now());
      process.env[name] = expected;

      expect.assertions(assertions);

      // The stream will emit once then complete. After completing the stream
      // will remain idle as it watches for dependency changes. The stream is
      // provided the current `process.env` each time it is forked.
      subscriber = createStream({ definitions, shouldWatch: true })
        .pipe(take(assertions))
        .subscribe(
          (envValue) => {
            expect(envValue).toBe(expected);

            expected = String(Date.now());
            process.env[name] = expected;

            touchResolveProcessEnvOnce();
          },
          done.fail,
          done
        );
    });

    it("does not refresh stream when dependency changes and not watching", async (done) => {
      const [invert] = await copyToUniqueTmpDir([fixtures("invert.js")]);

      const touchInvertOnce = once(() => {
        touch(invert);
      });

      // The first operator is used as a heartbeat to keep the stream alive.
      // The next operator simply inverts the value of the first. While the
      // stream is running the invert operator is touched. If the stream was
      // watching then the stream would start from the first expected value.
      const definitions = [{ use: fixtures("interval") }, { use: invert }];
      const expected = [0, -1, -2];
      const assertions = expected.length;

      expect.assertions(assertions);

      // Notice how this is not passing shouldWatch: false to use default
      // behavior.
      subscriber = createStream({ definitions })
        .pipe(take(assertions))
        .subscribe(
          (value) => {
            expect(value).toEqual(expected.shift());

            touchInvertOnce();
          },
          done.fail,
          done
        );
    });

    it("stream completes when not watching", async (done) => {
      const values = [0, 1, 2];
      const definitions = [{ use: "@finch/values", params: { values } }];
      const assertions = values.length;

      expect.assertions(assertions);

      // This stream completes on its own after yielding all values.
      subscriber = createStream({ definitions }).subscribe(
        (value) => {
          expect(value).toBe(values.shift());
        },
        done.fail,
        done
      );
    });

    it("stream completes when watching if there are no dependencies", async (done) => {
      const values = ["Hello World"];
      const definitions = [{ use: "@finch/values", params: { values } }];

      // This stream will emit "Hello World" and then complete. It's been
      // instructed to watch dependencies yet there are none to watch. Node
      // module depdencies are treated as static dependencies.
      expect.assertions(values.length);

      subscriber = createStream({ definitions, shouldWatch: true }).subscribe(
        (v) => {
          expect(v).toBe(values[0]);
        },
        done.fail,
        done
      );
    });

    it("does not complete the stream when watching and there are depdencies", async (done) => {
      const values = [0, 1, 2];
      const expected = [0, -1, -2];
      const definitions = [
        // The invert.js depdendency is watched for changes.
        { use: "@finch/values", params: { values } },
        { use: fixtures("invert.js") },
      ];
      const assertions = expected.length;

      expect.assertions(assertions + 1);

      // This stream completes on its own after yielding all values.
      subscriber = createStream({ definitions, shouldWatch: true }).subscribe(
        (value) => {
          expect(value).toBe(expected.shift());

          if (!expected.length) {
            // Once all values have been emitted the subscriber should remain
            // subscribed. It's necessary to check for this after a delay.
            setTimeout(() => {
              expect(subscriber.closed).toBe(false);
              done();
            }, 100);
          }
        },
        done.fail
      );
    });

    it("re-runs completed stream after dependency changes while watching", async (done) => {
      const [invert] = await copyToUniqueTmpDir([fixtures("invert.js")]);
      const touchInvertOnce = once(() => touch(invert));

      // The first operator in the stream completes after emitting the expected
      // value. But the stream does not complete because its dependencies are
      // being watched.
      const expected = 1;
      const definitions = [
        { use: "@finch/values", params: { values: [expected] } },
        { use: invert },
      ];

      // We should receive the inverted value two times. Once immediately and
      // once again after the `invert` dependency is touched.
      const assertions = 2;

      expect.assertions(assertions);

      subscriber = createStream({ definitions, shouldWatch: true })
        .pipe(take(assertions))
        .subscribe(
          (actual) => {
            // Expect to receive the inverted value provided to `of.js`.
            expect(actual).toBe(-expected);

            // Touch the invert dependency once after the inverted value.
            touchInvertOnce();
          },
          done.fail,
          done
        );
    });

    // This test fails consistently on CI. Chokidar isn't emitting add events
    // for both files after they're restored. Polling and massively increasing
    // the delays did not help. Best no remove `.ignore` when working on
    // createStream specs.
    it.skip("re-runs stream after removed dependencies are restored while watching", async (done) => {
      const [invert, multiplyBy10] = await copyToUniqueTmpDir([
        fixtures("invert.js"),
        fixtures("multiply-by-10.js"),
      ]);

      const unlinkThenRestoreOnce = once(async () => {
        // Waiting before each unlink and re-copy will cause the watcher to
        // receive multiple `unlink` and `add` events. Avoiding the wait will
        // result in the watcher seeing only a `change` events.
        await fs.unlink(invert);
        await fs.unlink(multiplyBy10);
        await superGenerousStabilityThreshold;
        await fs.copyFile(
          fixtures("invert.js"),
          path.join(path.dirname(invert), "invert.js")
        );
        await fs.copyFile(
          fixtures("multiply-by-10.js"),
          path.join(path.dirname(multiplyBy10), "multiply-by-10.js")
        );
      });

      const definitions = [
        { use: "@finch/values", params: { values: [1] } },
        { use: multiplyBy10 },
        { use: invert },
      ];

      // We should receive the expected value two times. Once immediately and
      // once again after the the dependencies are deleted then restored.
      const assertions = 2;

      expect.assertions(assertions);

      subscriber = createStream({ definitions, shouldWatch: true })
        .pipe(take(assertions))
        .subscribe(
          (actual) => {
            expect(actual).toBe(-10);

            // Delete both dependencies then restore both dependencies. The
            // stream will wait until all deleted dependencies are restored
            // before the stream is re-run.
            unlinkThenRestoreOnce();
          },
          done.fail,
          done
        );
    });
  });

  describe("when recovering from stream error", () => {
    it("does not catch stream errors by default", (done) => {
      // The reject operator immediately returns a promise which rejects with an
      // Error presenting the `message`. The stream's error handler is
      // presented the error.
      const message = String(Date.now());
      const definitions = [{ use: fixtures("reject.js"), params: { message } }];

      subscriber = createStream({ definitions }).subscribe(
        done.fail,
        (error) => {
          expect(error.message).toBe(`Error: ${message}`);
          done();
        }
      );
    });

    it("catches stream error when watching then re-runs stream after error after first stream dependency change", async (done) => {
      const [reject, resolve] = await copyToUniqueTmpDir([
        fixtures("reject.js"),
        fixtures("resolve.js"),
      ]);

      const operator = path.join(path.dirname(reject), "operator.js");
      const message = "Hello World";
      const definitions = [{ use: operator, params: { message } }];

      // At construction time the operator is the reject operator. Then sometime
      // after the stream is created the operator is replaced with the resolve
      // operator. This is used to infer stream behavior.
      // - The operator errors up front. The error is caught due to watch mode
      //   and having a dependency.
      // - Later the stream is re-run after the dependency changes. The time
      //   waited is static, the stream doesn't let us know when it has an error
      //   while watching. The actual wait is dependent on the speed at which
      //   the stream receives the error. The wait slows down all tests but
      //   using a generous delay is currently the safest approach.
      // - On the second run the stream emits without error.
      await fs.copyFile(reject, operator);

      expect.assertions(1);

      subscriber = createStream({ definitions, shouldWatch: true }).subscribe(
        (value) => {
          expect(value).toBe(message);
          done();
        },
        done.fail
      );

      await wait(superGenerousStabilityThreshold);

      await fs.copyFile(resolve, operator);
    });
  });
});
