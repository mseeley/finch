/* eslint-env jest */

const path = require("path");
const { localNameOf } = require("../index");

describe(localNameOf(__filename), () => {
  const fixtures = (file = "") =>
    path.resolve(__dirname, "__fixtures__", "readFile", file);

  it("reads file contents", async () => {
    const readFile = require("./readFile");
    const filename = fixtures("string.json");
    const data = await readFile({ filename });

    // File contents are returned as is, no trimming.
    expect(data).toBe(`"hello world"\n`);
  });

  it("reads contents using utf8 encoding", async () => {
    const ioc = {
      "fs-extra": {
        ...require("fs-extra"),
        readFile: jest.fn(() => Promise.resolve()),
      },
    };

    const readFile = require("./readFile", ioc);
    const filename = fixtures("string.json");

    await readFile({ filename }, ioc);

    expect(ioc["fs-extra"].readFile).toHaveBeenCalledTimes(1);
    expect(ioc["fs-extra"].readFile).toHaveBeenLastCalledWith(filename, {
      encoding: "utf8",
    });
  });

  it("throws when asked to read non-file", () => {
    const filename = __dirname;
    const readFile = require("./readFile");

    return expect(readFile({ filename })).rejects.toThrow(
      `Not a file: ${filename}`
    );
  });

  it("throws when asked to read nonexistent-file", () => {
    const filename = fixtures("i-do-not-exist.json");
    const readFile = require("./readFile");

    return expect(readFile({ filename })).rejects.toThrow(
      `Missing or unreadable: ${filename}`
    );
  });

  it("throws when asked to using a relative path", () => {
    const filename = "./__fixtures__/string.json";
    const readFile = require("./readFile");

    return expect(readFile({ filename })).rejects.toThrow(
      `An absolute path is required: ${filename}`
    );
  });
});
