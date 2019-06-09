/* eslint-env jest */

const Emitter = require("events");
const path = require("path");
const fs = require("fs-extra");
const { skip, take } = require("rxjs/operators");
const tmp = require("tmp");
const { localNameOf } = require("@finch/core");

describe(localNameOf(__filename), () => {
  const data = { hello: "world" };
  const logger = {
    debug(...args) {
      // console.log(...args);
    },
    verbose(...args) {
      // console.log(...args);
    },
    error(...args) {
      // console.error(...args);
    },
  };

  const watch = params => {
    const watchMany = require("./watchMany");

    return watchMany({ dirname, logger, stabilityThreshold: 100, ...params });
  };

  let dirname;
  let a = {};
  let b = {};
  let subscriber;

  beforeAll(() => {
    tmp.setGracefulCleanup();

    dirname = tmp.dirSync({ unsafeCleanup: true }).name;

    const options = {
      postfix: ".json",
      discardDescriptor: true,
      dir: dirname,
    };

    let filename = tmp.fileSync(options).name;
    a = {
      filename,
      glob: path.basename(filename),
    };

    filename = tmp.fileSync(options).name;
    b = {
      filename,
      glob: path.basename(filename),
    };
  });

  beforeEach(() => {
    fs.writeJsonSync(a.filename, data);
    fs.writeJsonSync(b.filename, data);
  });

  afterEach(() => {
    if (subscriber) {
      subscriber.unsubscribe();
    }
  });

  afterAll(() => {
    fs.unlinkSync(a.filename);
    fs.unlinkSync(b.filename);
  });

  it("throws if the dirname is not an absolute path", () => {
    const watchMany = require("./watchMany");

    expect(() => {
      watchMany({ dirname: "any-directory", glob: "config.json" });
    }).toThrow();
  });

  it("emits a null config when the watcher is ready", done => {
    const spy = jest.fn();

    subscriber = watch({ glob: a.glob })
      .pipe(take(1))
      .subscribe(spy, null, () => {
        expect(spy.mock.calls[0]).toEqual([{ isReady: true, config: null }]);
        done();
      });
  });

  it("emits a file's initial value", done => {
    const spy = jest.fn();

    subscriber = watch({ glob: a.glob })
      .pipe(
        // Skip the ready signal
        skip(1),
        take(1)
      )
      .subscribe(spy, null, () => {
        const expected = {
          isReady: true,
          config: { data, filename: a.filename },
        };
        expect(spy.mock.calls[0]).toEqual([expected]);
        done();
      });
  });

  it("emits each files initial value", done => {
    const spy = jest.fn();

    subscriber = watch({ glob: "*.json" })
      .pipe(
        // Skip the ready signal
        skip(1),
        take(2)
      )
      .subscribe(spy, null, () => {
        const calls = spy.mock.calls;
        const indexA = calls.findIndex(
          call => call[0].config.filename === a.filename
        );
        const indexB = calls.findIndex(
          call => call[0].config.filename === b.filename
        );

        // The order of the onNext calls is indeterminate.
        expect(indexA).toBeGreaterThanOrEqual(0);
        expect(indexB).toBeGreaterThanOrEqual(0);
        expect(indexA).not.toEqual(indexB);

        done();
      });
  });

  it("emits data when a file's content changes", done => {
    const { filename } = a;
    const nextData = { ...data, foo: true };

    const spy = jest.fn(() => {
      if (spy.mock.calls.length === 1) {
        fs.writeJsonSync(a.filename, nextData);
      }
    });

    subscriber = watch({ glob: a.glob })
      .pipe(
        // Skip the ready signal
        skip(1),
        take(2)
      )
      .subscribe(spy, null, () => {
        const initialConfig = { isReady: true, config: { data, filename } };
        // prettier-ignore
        const nextConfig = { isReady: true, config: { data: nextData, filename } };

        expect(spy.mock.calls[0]).toEqual([initialConfig]);
        expect(spy.mock.calls[1]).toEqual([nextConfig]);
        done();
      });
  });

  it("emits null data when a file is removed", done => {
    const { filename, glob } = a;
    const spy = jest.fn(() => {
      if (spy.mock.calls.length === 1) {
        fs.unlink(filename);
      }
    });

    subscriber = watch({ glob })
      .pipe(take(3))
      .subscribe(spy, null, () => {
        // prettier-ignore
        expect(spy.mock.calls[0]).toEqual([{ isReady: true, config: null }]);
        // prettier-ignore
        expect(spy.mock.calls[1]).toEqual([{ isReady: true, config: { data, filename } }]);
        // prettier-ignore
        expect(spy.mock.calls[2]).toEqual([{ isReady: true, config: { data: null, filename } }]);
        done();
      });
  });

  it("supports watching files before they exist", done => {
    const filename = tmp.tmpNameSync({ postfix: ".yml", dir: dirname });
    const spy = jest.fn(() => {
      if (spy.mock.calls.length === 1) {
        fs.writeFile(filename, 'hello: "world"', { encoding: "utf8" });
      }
    });

    subscriber = watch({ glob: "*.yml" })
      .pipe(take(2))
      .subscribe(spy, null, () => {
        // prettier-ignore
        expect(spy.mock.calls[0]).toEqual([{ isReady: true, config: null }]);
        // prettier-ignore
        expect(spy.mock.calls[1]).toEqual([{ isReady: true, config: { data, filename } }]);
        done();
      });
  });

  describe("when reading file contents", () => {
    it("emits readConfig errors", done => {
      jest.mock("./helpers", () => ({
        readConfig: () => Promise.reject(new Error("spec:watchMany")),
      }));

      subscriber = watch({ glob: a.glob }).subscribe(null, err => {
        expect(err.message).toBe("spec:watchMany");
        expect(err instanceof Error).toBe(true);
        done();
      });
    });
  });

  describe("when managing the file watcher", () => {
    function MockChokidar() {
      this.emitter = new Emitter();
      this.close = jest.fn();
      this.on = function(eventName, handler) {
        this.emitter.on(eventName, handler);
        return this;
      };
    }

    it("closes file watcher and emits on file watcher error", done => {
      const mockInstance = new MockChokidar();

      jest.mock("chokidar", () => ({ watch: () => mockInstance }));

      subscriber = watch({ glob: a.glob }).subscribe(null, err => {
        // The Observable is not yet stopped although it will be after the error
        // propagation completes.
        setImmediate(() => {
          expect(err.message).toBe("spec:watchMany");
          expect(err instanceof Error).toBe(true);
          expect(mockInstance.close.mock.calls.length).toBe(1);
          done();
        });
      });

      mockInstance.emitter.emit("error", new Error("spec:watchMany"));
    });

    it("closes the file watcher at unsubscribe", () => {
      const mockInstance = new MockChokidar();

      jest.mock("chokidar", () => ({ watch: () => mockInstance }));

      subscriber = watch({ glob: a.glob }).subscribe(() => {});

      subscriber.unsubscribe();

      expect(mockInstance.close.mock.calls.length).toBe(1);
    });
  });
});
