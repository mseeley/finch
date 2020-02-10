/* eslint-env jest */

const path = require("path");
const fs = require("fs-extra");
const { of, EMPTY } = require("rxjs");
const { take } = require("rxjs/operators");
const tmp = require("tmp");
const {
  copyToUniqueTmpDir,
  once,
  wait,
  stabilityThreshold,
  superGenerousStabilityThreshold,
} = require("./__fixtures__/helpers");
const createStreamFromPath = require("./createStreamFromPath");
const localNameOf = require("./localNameOf");

describe(localNameOf(__filename), () => {
  function fixtures(filename = "") {
    return path.join(
      __dirname,
      "__fixtures__",
      "createStreamFromPath",
      filename
    );
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

    if (subscriber) {
      subscriber.unsubscribe();
      subscriber = null;
    }
  });

  describe("when creating a stream", () => {
    it("errors without an absolute pathname", done => {
      // Error thrown by `createStreamFromPath`.
      subscriber = createStreamFromPath({
        pathname: "./does-not-exist.json",
      }).subscribe(done.fail, error => {
        expect(error.message).toEqual(
          expect.stringContaining("Path must be absolute")
        );
        done();
      });
    });

    test.each([
      ["from a file that doesn't exist", "/does-not-exist.json", false],
      [
        "from a file that doesn't exist when watching",
        "/does-not-exist.json",
        true,
      ],
      ["from a directory that does not exist", "/does-not-exist/", false],
      [
        "from a directory that does not exist while watching",
        "/does-not-exist/",
        true,
      ],
    ])(
      "errors when creating a stream %s",
      (suffix, pathname, shouldWatch, done) => {
        // Errors thrown by `watchFiles`.
        subscriber = createStreamFromPath({
          pathname,
          shouldWatch,
        }).subscribe(
          done.fail,
          error => {
            expect(error.message).toEqual(
              expect.stringContaining("Path must exist")
            );
            done();
          },
          done.fail
        );
      }
    );

    test.each([
      ["from a glob with a base that doesn't exist", false],
      ["from a glob with a base that doesn't exist when watching", true],
    ])("errors when creating a stream %s", (suffix, shouldWatch, done) => {
      const dirname = tmp.dirSync().name;
      const base = `${dirname}/does-not-exist`;
      const glob = `${base}/*.json`;

      // Errors thrown by `watchFiles`.
      subscriber = createStreamFromPath({
        pathname: glob,
        shouldWatch,
      }).subscribe(
        done.fail,
        error => {
          expect(error.message).toEqual(
            expect.stringContaining("Path must exist")
          );
          done();
        },
        done.fail
      );
    });

    // There is no direct way to test that the stream file itself is not watched
    // by default. The watcher is used to retrieve the initial file list when
    // watching _and_ when not watching. We can confirm that `createStream`
    // receives `shouldWatch: false` by default but we cannot test that
    // `createStreamFromPath` isn't watching the stream's own file.
    it.todo("does not watch by default.");
  });

  describe("when active stream files are deleted", () => {
    test.each([
      ["definition is deleted", { shouldWatch: false }],
      ["definition is deleted while watching", { shouldWatch: true }],
    ])("does not error when %s", async (desc, options, done) => {
      const [never] = await copyToUniqueTmpDir([
        fixtures("never.json"),
        fixtures("never.js"),
      ]);

      subscriber = createStreamFromPath({ pathname: never }).subscribe(
        done.fail,
        done.fail,
        done.fail
      );

      // This is an indirect test. There are no tells to suggest the stream has
      // created the stream. I haven't figure out a way to have an Rx Observable
      // stream copied to tmp. So, instead this Promise stream which never emits,
      // errors, or completes is copied.
      //
      // Assume the stream definition has been consumed after "time". Then
      // delete it. The stream should not error after its had enough time to
      // detect the deletion. The stream should not be listening at all.
      //
      // It's important to verify behavior in code by observing watchFiles.
      expect.assertions(0);

      await wait(1000);
      await fs.unlink(never);
      await wait(1000);
      done();
    });

    it("does not error when definition is unlinked when parent directory is unlinked while watching", async done => {
      const [never] = await copyToUniqueTmpDir([
        fixtures("never.json"),
        fixtures("never.js"),
      ]);

      subscriber = createStreamFromPath({
        pathname: never,
        shouldWatch: true,
      }).subscribe(done.fail, done.fail, done.fail);

      // This is an indirect test. There are no tells to suggest the stream has
      // created the stream. I haven't figure out a way to have an Rx Observable
      // stream copied to tmp. So, instead this Promise stream which never emits,
      // errors, or completes is copied.
      //
      // Assume the stream definition has been consumed after "time". Then
      // delete it. The stream should not error after its had enough time to
      // detect the deletion.
      //
      // It's important to verify behavior in code by observing watchFiles.
      expect.assertions(0);

      await wait(1000);
      await fs.unlink(path.resolve("..", never));
      await wait(1000);
      done();
    });
  });

  describe("when matching glob or directory of streams", () => {
    it("an error in one stream doesn't affect other streams", done => {
      const dirname = fixtures();
      const onNext = jest.fn();

      // This glob matches three stream definitions. This test covers testing
      // errors reading the stream definition file and an error from a running
      // stream.
      //
      // - stream-invalid.json: invalid definition.
      // - stream-interval.json: valid definition. Yields ints.
      // - stream-interval-errors-when-odd: valid definition. Yields only even
      //   ints, else errors.
      const glob = path.join(dirname, "stream-*");
      const assertions = 5;

      subscriber = createStreamFromPath({
        pathname: glob,
        shouldWatch: true,
        continueOnError: true,
      })
        .pipe(take(assertions))
        .subscribe(onNext, done.fail, () => {
          expect(onNext).toHaveBeenCalledTimes(assertions);
          // Each valid definition emits even: 0
          expect(onNext).toHaveBeenNthCalledWith(1, 0);
          expect(onNext).toHaveBeenNthCalledWith(2, 0);
          // stream-interval emits 1. While stream-interval-errors-when-odd throws
          // an error.
          expect(onNext).toHaveBeenNthCalledWith(3, 1);
          // Each valid definition emits even: 2
          expect(onNext).toHaveBeenNthCalledWith(4, 2);
          expect(onNext).toHaveBeenNthCalledWith(5, 2);

          done();
        });
    });

    test.each([
      // Provide no glob to test directory watching behavior.
      "",
      // Provide a simple glob that will match available fixture definitions.
      "valid.*",
    ])(
      "added stream files are run while matching directory: %s",
      async (glob, done) => {
        const [validJSON] = await copyToUniqueTmpDir([
          fixtures("valid.json"),
          fixtures("resolve.js"),
        ]);

        const dirname = path.dirname(validJSON);

        const copyValidYamlOnce = once(async () => {
          const validYAML = fixtures("valid.yaml");
          const destination = path.resolve(dirname, path.basename(validYAML));

          await fs.copyFile(validYAML, destination);
        });

        const onNext = jest.fn();

        subscriber = createStreamFromPath({
          pathname: path.join(dirname, glob),
          shouldWatch: true,
        })
          .pipe(take(2))
          .subscribe(
            async v => {
              onNext(v);
              await copyValidYamlOnce();
            },
            done.fail,
            () => {
              // First the existing valid.json stream will emit a value. Then
              // the newly copied valid.yaml stream will emit a value.
              expect(onNext).toHaveBeenCalledTimes(2);
              expect(onNext).toHaveBeenNthCalledWith(1, "valid.json");
              expect(onNext).toHaveBeenNthCalledWith(2, "valid.yaml");
              done();
            }
          );
      }
    );
  });

  describe("when a stream file changes", () => {
    it("it refreshes a stream after its file changes while watching", async done => {
      const [validJSON] = await copyToUniqueTmpDir([
        fixtures("valid.json"),
        fixtures("resolve.js"),
      ]);

      const touchValidJSONOnce = once(async () => {
        const json = await fs.readJSON(validJSON);

        json[0].params.message = "valid.json touched!";

        await fs.writeJSON(validJSON, json);
      });

      const onNext = jest.fn();

      const assertions = 2;

      subscriber = createStreamFromPath({
        pathname: validJSON,
        shouldWatch: true,
      })
        .pipe(take(assertions))
        .subscribe(
          async v => {
            onNext(v);
            await touchValidJSONOnce();
          },
          done.fail,
          () => {
            expect(onNext).toHaveBeenCalledTimes(assertions);
            expect(onNext).toHaveBeenNthCalledWith(1, "valid.json");
            expect(onNext).toHaveBeenNthCalledWith(2, "valid.json touched!");
            done();
          }
        );
    });

    it("it does not refresh other streams while watching", async done => {
      const [validJSON] = await copyToUniqueTmpDir([
        fixtures("valid.json"),
        fixtures("valid.yaml"),
        fixtures("resolve.js"),
      ]);

      const touchValidJSONOnceThenAssert = once(async () => {
        const json = await fs.readJSON(validJSON);

        json[0].params.message = "valid.json touched!";

        await fs.writeJSON(validJSON, json);

        // Wait for a generous timeout to ensure that the change to valid.json
        // does not cause valid.yaml to emit.
        await wait(superGenerousStabilityThreshold);

        // The initial `valid.json` and `valid.yaml` emits come in an
        // undefined order.
        expect(onNext).toHaveBeenCalledTimes(3);
        expect(onNext).toHaveBeenCalledWith("valid.json");
        expect(onNext).toHaveBeenCalledWith("valid.yaml");
        expect(onNext).toHaveBeenLastCalledWith("valid.json touched!");

        done();
      });

      const onNext = jest.fn();

      subscriber = createStreamFromPath({
        pathname: path.join(path.dirname(validJSON), "valid.*"),
        shouldWatch: true,
      }).subscribe(async v => {
        onNext(v);
        await touchValidJSONOnceThenAssert();
      }, done.fail);
    });
  });

  describe("when sub streams complete", () => {
    it("completes stream when all sub streams complete", async done => {
      const [validJSON] = await copyToUniqueTmpDir([
        fixtures("valid.json"),
        fixtures("valid.yaml"),
        fixtures("resolve.js"),
      ]);

      const onNext = jest.fn();

      subscriber = createStreamFromPath({
        pathname: path.join(path.dirname(validJSON), "valid.*"),
      }).subscribe(onNext, done.fail, () => {
        expect(onNext).toHaveBeenCalledTimes(2);
        expect(onNext).toHaveBeenCalledWith("valid.json");
        expect(onNext).toHaveBeenCalledWith("valid.yaml");
        done();
      });
    });

    it("does not complete stream when all sub streams complete when watching", async done => {
      const [validJSON] = await copyToUniqueTmpDir([
        fixtures("valid.json"),
        fixtures("valid.yaml"),
        fixtures("resolve.js"),
      ]);

      const onNext = jest.fn();

      subscriber = createStreamFromPath({
        pathname: path.join(path.dirname(validJSON), "valid.*"),
        shouldWatch: true,
      }).subscribe(
        async v => {
          onNext(v);

          // After both streams have emitted there values then set a timeout
          // and assert. The stream should _not_ complete.
          if (onNext.mock.calls.length === 2) {
            await wait(superGenerousStabilityThreshold);

            expect(onNext).toHaveBeenCalledTimes(2);
            expect(onNext).toHaveBeenCalledWith("valid.json");
            expect(onNext).toHaveBeenCalledWith("valid.yaml");
            done();
          }
        },
        done.fail,
        done.fail
      );
    });
  });

  describe("when providing expected arguments to createStream", () => {
    const ioc = {
      createStream: jest.fn(() => {
        // Returning EMPTY will cause the shouldWatch: true configurations below
        // to never complete.
        return of(42);
      }),
    };

    test.each([
      [
        "expected default options",
        {
          input: {},
          expected: { continueOnError: undefined, shouldWatch: false },
        },
      ],
      [
        "expected options when watching",
        {
          input: { shouldWatch: true },
          expected: { continueOnError: undefined, shouldWatch: true },
        },
      ],
      [
        "expected options when operators should continue on error",
        {
          input: { continueOnError: true },
          expected: { continueOnError: true, shouldWatch: false },
        },
      ],
      [
        "expected options when operators should not continue on error",
        {
          input: { continueOnError: false },
          expected: { continueOnError: false, shouldWatch: false },
        },
      ],
    ])("creates a stream with %s", async (name, options, done) => {
      const [validJSON] = await copyToUniqueTmpDir([
        fixtures("valid.json"),
        fixtures("resolve.js"),
      ]);

      subscriber = createStreamFromPath(
        {
          pathname: validJSON,
          ...options.input,
        },
        ioc
      )
        // `take(1)` is required as a hook to complete the watcher streams.
        .pipe(take(1))
        .subscribe(null, done.fail, () => {
          expect(ioc.createStream).toHaveBeenCalledTimes(1);

          expect(ioc.createStream).toHaveBeenLastCalledWith(
            expect.objectContaining({
              definitions: fs.readJSONSync(validJSON),
              resolveFrom: path.dirname(validJSON),
              ...options.expected,
            })
          );

          done();
        });
    });
  });

  describe("when providing pathnames to file watcher", () => {
    const ioc = {
      watchFiles: jest.fn(() => EMPTY),
    };

    test.each([
      // Create streams from a directory.
      {
        input: __dirname,
        expected: [
          path.join(__dirname, "*.json"),
          path.join(__dirname, "*.yaml"),
          path.join(__dirname, "*.yml"),
        ],
      },
      // Create streams from a glob pattern.
      {
        input: path.join(__dirname, "*"),
        expected: [path.join(__dirname, "*")],
      },
      // Create stream for a specific file.
      {
        input: path.join(__dirname, "definitions.json"),
        expected: [path.join(__dirname, "definitions.json")],
      },
    ])("watches correct files for: %s", (fields, done) => {
      subscriber = createStreamFromPath(
        { pathname: fields.input },
        ioc
      ).subscribe(null, done.fail, () => {
        expect(ioc.watchFiles).toHaveBeenCalledTimes(1);
        expect(ioc.watchFiles).toHaveBeenLastCalledWith(
          expect.objectContaining({
            pathnames: fields.expected,
          })
        );
        done();
      });
    });
  });
});
