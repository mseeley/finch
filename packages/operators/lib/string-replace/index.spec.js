/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const stringReplace = require("./index");

describe(localNameOf(__filename), () => {
  const params = { pattern: /world/, replacement: "moon" };

  it("returns a promise", () => {
    const payload = { value: "Hello world", params };

    return expect(stringReplace(payload)).resolves.toBe("Hello moon");
  });

  it("rejects is value is not a string", () => {
    const payload = { value: 42, params };

    return expect(stringReplace(payload)).rejects.toThrow(TypeError);
  });
});
