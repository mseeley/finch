/* eslint-env jest */

const path = require("path");
const { localNameOf } = require("@finch/core");

describe(localNameOf(__filename), () => {
  const fixture = file => path.resolve(__dirname, "fixtures", file);

  test.each(["valid.json", "valid.yaml", "valid.yml"])(
    "returns configuration from valid configuration: %s",
    async file => {
      const filename = fixture(file);
      const readFile = require("./index");
      const data = await readFile({ filename });
      const expected = {
        filename,
        data: { hello: "world" },
      };

      expect(data).toEqual(expected);
    }
  );

  test.each(["empty.json", "empty.yaml", "empty.yml"])(
    "returns null configuration for empty file: %s",
    async file => {
      const filename = fixture(file);
      const readFile = require("./index");
      const data = await readFile({ filename });
      const expected = {
        filename,
        data: null,
      };

      expect(data).toEqual(expected);
    }
  );

  test.each(["no-value.json", "no-value.yaml", "no-value.yml"])(
    "returns null configuration for value-less configuration: %s",
    async file => {
      const filename = fixture(file);
      const readFile = require("./index");
      const data = await readFile({ filename });
      const expected = {
        filename,
        data: null,
      };

      expect(data).toEqual(expected);
    }
  );

  test.each([
    "invalid-syntax.json",
    "invalid-syntax.yaml",
    "invalid-syntax.yml",
  ])("throws when configuration has invalid syntax: %s", async file => {
    let error;

    try {
      const filename = fixture(file);
      const readFile = require("./index");
      await readFile({ filename });
    } catch (err) {
      error = err;
    }

    // expect#toThrow() isn't preventing node from complaining about an
    // unhandled promise rejection.
    expect(error);
  });

  it("returns null configuration when file does not exist", async () => {
    const filename = path.resolve(
      __dirname,
      "fixtures",
      "assumed-available-later.json"
    );

    const readFile = require("./index");
    const data = await readFile({ filename });

    const expected = {
      filename,
      data: null,
    };

    expect(data).toEqual(expected);
  });

  it("passes utf8 encoding to fs", async () => {
    const fs = require("fs");
    const spy = jest.spyOn(fs, "readFile");
    const readFile = require("./index");

    await readFile({ filename: fixture("valid.json") });

    const lastCall = spy.mock.calls[spy.mock.calls.length - 1];

    expect(lastCall[1]).toEqual({ encoding: "utf8" });
  });

  it("calls asynchronous fs methods by default", async () => {
    const fs = require("fs");
    const readFileSpy = jest.spyOn(fs, "readFile");
    const existsSpy = jest.spyOn(fs, "exists");
    const readFile = require("./index");

    const readFileSpyCallsBefore = readFileSpy.mock.calls.length;
    const existsSpyCallsBefore = existsSpy.mock.calls.length;

    await readFile({ filename: fixture("valid.json") });

    expect(readFileSpyCallsBefore).toEqual(readFileSpy.mock.calls.length - 1);
    expect(existsSpyCallsBefore).toEqual(existsSpy.mock.calls.length - 1);
  });

  it("calls synchronous fs methods on demand", async () => {
    const fs = require("fs");
    const readFileSyncSpy = jest.spyOn(fs, "readFileSync");
    const existsSyncSpy = jest.spyOn(fs, "existsSync");
    const readFileSync = require("./index");

    const readFileSyncSpyCallsBefore = readFileSyncSpy.mock.calls.length;
    const existsSyncSpyCallsBefore = existsSyncSpy.mock.calls.length;

    await readFileSync({ filename: fixture("valid.json"), sync: true });

    expect(readFileSyncSpyCallsBefore).toEqual(
      readFileSyncSpy.mock.calls.length - 1
    );
    expect(existsSyncSpyCallsBefore).toEqual(
      existsSyncSpy.mock.calls.length - 1
    );
  });
});
