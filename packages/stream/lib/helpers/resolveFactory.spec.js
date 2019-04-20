/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const resolveFactory = require("./resolveFactory");

describe(localNameOf(__filename), () => {
  const use = "./__fixtures__/operators/atypical/empty";

  it("resolves a module factory using a string `use` value", () => {
    const actual = resolveFactory({ use });

    expect(actual instanceof Function).toBe(true);
    expect(actual).toBe(require(use));
  });

  it("returns an identity promise factory when `off` is defined", () => {
    const off = use;
    const value = 42;
    const actual = resolveFactory({ off });

    expect(actual instanceof Function).toBe(true);

    return expect(actual({ value })).resolves.toBe(value);
  });

  it("throws if `use` does not resolve to a module factory", () => {
    expect(() => {
      resolveFactory({ use: "this is not a module" });
    }).toThrow();
  });
});
