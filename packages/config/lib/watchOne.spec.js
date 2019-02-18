/* eslint-env jest */

const path = require("path");
const { localNameOf } = require("@finch/core");

describe(localNameOf(__filename), () => {
  beforeEach(() => {
    jest.mock("./watchMany");
  });

  it("configures watchMany to watch single file", () => {
    const watchOne = require("./watchOne");
    const watchMany = require("./watchMany");
    const dirname = __dirname;
    const glob = "imaginary-file.json";

    watchOne({ filename: path.join(__dirname, glob) });

    expect(watchMany.mock.calls.length).toEqual(1);

    expect(watchMany.mock.calls[0][0]).toEqual({ dirname, glob });
  });

  it("throws if filename argument is not an absolute path", () => {
    const watchOne = require("./watchOne");
    const glob = "imaginary-file.json";

    expect(() => {
      watchOne({ filename: glob });
    }).toThrow();
  });
});
