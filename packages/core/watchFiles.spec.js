/* eslint-env jest */

const fs = require("fs");
const path = require("path");
const { EMPTY, merge } = require("rxjs");
const { catchError, take, takeWhile } = require("rxjs/operators");
const tmp = require("tmp");
const {
  wait,
  stabilityThreshold,
  superGenerousStabilityThreshold,
} = require("./__fixtures__/helpers");
const localNameOf = require("./localNameOf");
const watchFiles = require("./watchFiles");

describe(localNameOf(__filename), () => {
  beforeAll(() => {
    tmp.setGracefulCleanup();
  });

  describe("when validating input options", () => {
    it("requires one or more absolute paths", done => {
      const observables = [
        watchFiles({ pathnames: 42 }),
        watchFiles({ pathnames: [] }),
        watchFiles({ pathnames: ["/", "./"] }),
      ].map(observable =>
        observable.pipe(
          catchError(error => {
            const message = "One or more absolute paths are required";

            expect(error.message).toEqual(expect.stringContaining(message));

            return EMPTY;
          })
        )
      );

      merge(...observables)
        .pipe(take(observables.length))
        .subscribe(null, null, () => {
          expect.assertions(observables.length);
          done();
        });
    });

    it("requires glob base exists", done => {
      const dirname = tmp.dirSync().name;
      const invalidDirname = path.join(dirname, "i-do-not-exist");
      const pathnames = [path.join(invalidDirname, "*.foo")];

      // `dirname` exists but the glob's base is `invalidDirname` which does not
      // exist.
      expect(fs.existsSync(dirname)).toBe(true);

      watchFiles({ pathnames }).subscribe(null, error => {
        expect(error.message).toEqual(
          expect.stringContaining(`Path must exist: ${invalidDirname}`)
        );
        done();
      });
    });

    it("requires non-glob pathname exists", done => {
      // Generate a file name that has no backing file.
      const invalidFilename = tmp.tmpNameSync();
      const pathnames = [invalidFilename];

      expect(fs.existsSync(invalidFilename)).toBe(false);

      watchFiles({ pathnames }).subscribe(null, error => {
        expect(error.message).toEqual(
          expect.stringContaining(`Path must exist: ${invalidFilename}`)
        );
        done();
      });
    });

    it("accepts mix of filenames and glob patterns", () => {
      const dir = tmp.dirSync().name;
      const filename = tmp.fileSync({ dir, postfix: ".foo" }).name;
      const pathnames = [path.join(dir, "*.bar"), filename];

      expect(() => {
        // The dir and filename must exist.
        const subscriber = watchFiles({ pathnames }).subscribe(() => {});

        subscriber.unsubscribe();
      }).not.toThrow();
    });
  });

  describe("when managing file watcher", () => {
    // `clearMocks` is used to automatically clear mocks between every test.
    const ioc = {
      watch: jest.fn(() => ({
        close: jest.fn(() => Promise.resolve()),
        off: jest.fn(),
        on: jest.fn(),
      })),
    };

    let env;

    beforeAll(() => {
      env = { ...process.env };
    });

    afterEach(() => {
      process.env = env;
    });

    it("creates a watcher per subscriber", () => {
      const obs$ = watchFiles({ pathnames: [__filename] }, ioc);
      expect(ioc.watch.mock.calls).toHaveLength(0);

      obs$.subscribe(() => {}).unsubscribe();
      expect(ioc.watch.mock.calls).toHaveLength(1);

      obs$.subscribe(() => {}).unsubscribe();
      expect(ioc.watch.mock.calls).toHaveLength(2);
    });

    it("passes sensible defaults to watcher", () => {
      watchFiles({ pathnames: [__filename] }, ioc)
        .subscribe(() => {})
        .unsubscribe();

      expect(ioc.watch.mock.calls[0][1]).toMatchInlineSnapshot(`
        Object {
          "atomic": true,
          "awaitWriteFinish": true,
          "ignoreInitial": false,
          "ignored": Array [
            /\\(\\^\\|\\[\\\\/\\\\\\\\\\]\\)\\\\\\.\\./,
            /\\[\\\\/\\\\\\\\\\]node_modules\\[\\\\/\\\\\\\\\\]/,
            /\\[\\\\/\\\\\\\\\\]package\\\\\\.json\\$/,
            /\\[\\\\/\\\\\\\\\\]package-lock\\\\\\.json\\$/,
          ],
          "persistent": true,
        }
      `);
    });

    it("reads FINCH_STABILITY_THRESHOLD from env", () => {
      process.env.FINCH_STABILITY_THRESHOLD = "42";

      watchFiles({ pathnames: [__filename] }, ioc)
        .subscribe(() => {})
        .unsubscribe();

      expect(ioc.watch.mock.calls[0][1].awaitWriteFinish).toEqual({
        stabilityThreshold: Number(process.env.FINCH_STABILITY_THRESHOLD),
      });
    });

    it("destroys watcher once during unsubscribe", () => {
      const subscriber = watchFiles(
        {
          pathnames: [__filename],
        },
        ioc
      ).subscribe(() => {});

      const watcher = ioc.watch.mock.results[0].value;

      // Call `unsubscribe()` more than once. It should only have side effects
      // once.
      subscriber.unsubscribe();
      subscriber.unsubscribe();

      // The watcher should be unsubscribed from and closed once.
      expect(watcher.close.mock.calls).toHaveLength(1);

      // The watcher should be unsubscribed from identically as subscribed to.
      expect(watcher.off.mock.calls).toEqual(watcher.on.mock.calls);
    });
  });

  describe("when watching paths", () => {
    let dir;
    let env;

    beforeAll(() => {
      env = process.env;

      // Reduce the stability threshold to keep these tests comfortably below
      // Jest's default 5s healthy test duration.
      process.env = {
        ...process.env,
        FINCH_STABILITY_THRESHOLD: String(stabilityThreshold),
      };
    });

    beforeEach(() => {
      // Give each test a unique directory to work within.
      dir = tmp.dirSync().name;
    });

    afterAll(() => {
      process.env = env;
    });

    it("ignores dot files and dot directories", done => {
      const dotFile = path.join(dir, ".fooshrc");
      const dotDir = path.join(dir, ".dotfiles");
      const regularFile = path.join(dotDir, "regularFile.txt");

      fs.mkdirSync(dotDir);
      fs.writeFileSync(dotFile, "Hello world");
      fs.writeFileSync(regularFile, "Hello world");

      expect(fs.existsSync(dotFile)).toBe(true);
      expect(fs.existsSync(dotDir)).toBe(true);
      expect(fs.existsSync(regularFile)).toBe(true);

      // The `dotFile` and `regularFile` would have an initial `add` events
      // emitted before `ready` if they were not ignored due to their own or
      // ancestor's dot name.
      const pathnames = [dotFile, regularFile];

      watchFiles({ pathnames, filterReady: true })
        .pipe(take(1))
        .subscribe(
          watched => {
            expect(watched.event).toBe("ready");
          },
          null,
          done
        );
    });

    it("ignores node_modules directories", done => {
      const ignoredDir = path.join(dir, "node_modules");
      const allowedFile = path.join(dir, "node_modules.txt");
      const ignoredFile = path.join(ignoredDir, "node_modules.txt");

      fs.mkdirSync(ignoredDir);
      fs.writeFileSync(allowedFile, "Hello world");
      fs.writeFileSync(ignoredFile, "Hello world");

      expect(fs.existsSync(ignoredDir)).toBe(true);
      expect(fs.existsSync(allowedFile)).toBe(true);
      expect(fs.existsSync(ignoredFile)).toBe(true);

      const pathnames = [allowedFile, ignoredFile];

      watchFiles({ pathnames, filterReady: true })
        .pipe(takeWhile(watched => watched.event !== "ready"))
        .subscribe(
          watched => {
            expect(watched.filename).toBe(allowedFile);
          },
          null,
          done
        );
    });

    test.each(["package.json", "package-lock.json"])(
      "allows %s directory",
      (dirname, done) => {
        const allowedDir = path.join(dir, dirname);
        const allowedFile = path.join(allowedDir, "foo.txt");

        fs.mkdirSync(allowedDir);
        fs.writeFileSync(allowedFile, "Hello world");

        expect.assertions(3);
        expect(fs.existsSync(allowedDir)).toBe(true);
        expect(fs.existsSync(allowedFile)).toBe(true);

        const pathnames = [allowedFile];

        watchFiles({ pathnames, filterReady: true })
          .pipe(takeWhile(watched => watched.event !== "ready"))
          .subscribe(
            watched => {
              expect(watched.filename).toBe(allowedFile);
            },
            null,
            done
          );
      }
    );

    test.each(["package.json", "package-lock.json"])(
      "ignores %s file",
      (filename, done) => {
        const allowedFile = path.join(dir, "foo.txt");
        const ignoredFile = path.join(dir, filename);

        fs.writeFileSync(allowedFile, "Hello world");
        fs.writeFileSync(ignoredFile, "Hello world");

        expect.assertions(3);
        expect(fs.existsSync(allowedFile)).toBe(true);
        expect(fs.existsSync(ignoredFile)).toBe(true);

        const pathnames = [allowedFile, ignoredFile];

        watchFiles({ pathnames, filterReady: true })
          .pipe(takeWhile(watched => watched.event !== "ready"))
          .subscribe(
            watched => {
              expect(watched.filename).toBe(allowedFile);
            },
            null,
            done
          );
      }
    );

    it("omits `ready` event by default", done => {
      const filename = tmp.fileSync({ dir }).name;
      const pathnames = [filename];

      // The watcher will emit the initial add for `filename`.
      watchFiles({ pathnames })
        .pipe(take(1))
        .subscribe(
          watched => {
            expect(watched.event).toBe("add");
            expect(watched.filename).toBe(filename);
          },
          null,
          done
        );
    });

    it("emits add, change, unlink by default", done => {
      const extname = ".foo";
      const pathnames = [path.join(dir, `*${extname}`)];

      let filename;

      const events = ["ready", "add", "change", "unlink"];
      expect.assertions(events.length);

      // This test must opt-into `filterReady` in order to keep assertions
      // around watcher operations race-free.
      watchFiles({ pathnames, filterReady: true })
        .pipe(take(events.length))
        .subscribe(
          watched => {
            expect(watched.event).toBe(events.shift());

            switch (watched.event) {
              case "ready":
                filename = tmp.fileSync({ dir, postfix: extname }).name;
                break;
              case "add":
                fs.writeFileSync(filename, "Hello World");
                break;
              case "change":
                fs.unlinkSync(filename);
                break;
            }
          },
          null,
          done
        );
    });

    it("emits initial adds by default", done => {
      const filename = tmp.fileSync({ dir }).name;
      const pathnames = [filename];

      expect(fs.existsSync(filename)).toBe(true);

      watchFiles({ pathnames })
        .pipe(take(1))
        .subscribe(
          watched => {
            // Initial add events are emitted before a ready event.
            expect(watched.event).toBe("add");
            expect(watched.filename).toBe(filename);
          },
          null,
          done
        );
    });

    it("optionally omits initial adds", done => {
      const filename = tmp.fileSync({ dir }).name;
      const pathnames = [filename];

      expect.assertions(2);
      expect(fs.existsSync(filename)).toBe(true);

      watchFiles({ pathnames, filterReady: true, ignoreInitial: true })
        .pipe(take(1))
        .subscribe(
          watched => {
            expect(watched.event).toBe("ready");
          },
          null,
          done
        );
    });

    test.each([
      ["add", "filterAdd"],
      ["change", "filterChange"],
      ["unlink", "filterUnlink"],
    ])("can emit only `%s` events", (eventName, filterName, done) => {
      const extname = ".foo";
      const pathnames = [path.join(dir, `*${extname}`)];

      let filename;

      // This test combines two watchers, both watching the same glob pattern.
      // The master watcher is responsible for causing `add`, `change`, and
      // `unlink` events. The watcher under test listens to a subset of the
      // events.
      //
      // The combined watchers approach ensures that filtering behavior of the
      // second watcher can be accurately asserted.

      // This is the subject of the assertions.
      const testSubject = watchFiles({
        pathnames,
        [filterName]: true,
      }).subscribe(watched => {
        expect(watched.event).toBe(eventName);
        expect(watched.filename).toBe(filename);
      });

      const events = ["ready", "add", "change", "unlink"];
      expect.assertions(events.length + 2);

      // This is the master watcher.
      watchFiles({ pathnames, filterReady: true })
        .pipe(take(events.length))
        .subscribe(
          watched => {
            expect(watched.event).toBe(events.shift());

            switch (watched.event) {
              case "ready":
                tmp.file({ dir, postfix: extname }, (err, file) => {
                  if (err) done();

                  filename = file;
                });

                break;
              case "add":
                fs.writeFile(filename, "Hello World", err => {
                  if (err) done();
                });
                break;
              case "change":
                fs.unlink(filename, err => {
                  if (err) done();
                });
                break;
            }
          },
          null,
          async () => {
            // Give the test subject time to receive the `unlink` event.
            await wait(superGenerousStabilityThreshold);

            testSubject.unsubscribe();
            done();
          }
        );
    });
  });
});
