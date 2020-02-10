/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const replace = require("./index");

describe(localNameOf(__filename), () => {
  it("returns a promise", () => {
    const params = { pattern: "/world/", replacement: "moon" };
    const payload = { value: "Hello world", params };

    return expect(replace(payload)).resolves.toBe("Hello moon");
  });

  it("rejects if value is not a string", () => {
    const params = { pattern: "/world/", replacement: "moon" };
    const payload = { value: 42, params };

    return expect(replace(payload)).rejects.toThrow(TypeError);
  });

  it("replaces a single occurence by default", () => {
    const params = { pattern: "/Hi/", replacement: "Bye" };
    const payload = { value: "Hi Edison! Hi Tesla!", params };

    return expect(replace(payload)).resolves.toBe("Bye Edison! Hi Tesla!");
  });

  it("replaces all occurences with flag", () => {
    const params = { pattern: "/Hi/g", replacement: "Bye" };
    const payload = { value: "Hi Edison! Hi Tesla!", params };

    return expect(replace(payload)).resolves.toBe("Bye Edison! Bye Tesla!");
  });
});
