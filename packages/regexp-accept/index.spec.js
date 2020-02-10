/* eslint-env jest */

const { EMPTY, localNameOf } = require("@finch/core");
const accept = require("./index");

describe(localNameOf(__filename), () => {
  const value = "value";

  describe("when presented improper input", () => {
    it("ignores value if empty parameters are passed", () => {
      const promise = accept({ value, params: {} });

      return expect(promise).resolves.toBe(EMPTY());
    });

    it("ignores value if empty params are passed", () => {
      const promise = accept({ value, params: { all: [], any: [] } });

      return expect(promise).resolves.toBe(EMPTY());
    });
  });

  describe("when ignoring using `pattern`", () => {
    it("resolves with value when `pattern` matches", () => {
      const promise = accept({ value, params: { pattern: "/v/" } });

      return expect(promise).resolves.toBe(value);
    });

    it("disregards `all` when `pattern` is provided", () => {
      // `pattern` should be provided but not match.
      // `any` should be provided and match
      const promise = accept({
        value,
        params: { pattern: "/foo/", any: ["/v/"] },
      });

      return expect(promise).resolves.toBe(EMPTY());
    });

    it("disregards `any` when `pattern` is provided", () => {
      // `pattern` should be provided but not match.
      // `any` should be provided and match
      const promise = accept({
        value,
        params: { pattern: "/foo/", all: ["/v/"] },
      });

      return expect(promise).resolves.toBe(EMPTY());
    });
  });

  describe("when accepting using `all`", () => {
    it("will resolve when multiple `all` expressions match", () => {
      const promise = accept({ value, params: { all: ["/v/", "/a/"] } });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve emptily if every `all` expression does not match", () => {
      const promise = accept({ value, params: { all: ["/v/", "/123/"] } });

      return expect(promise).resolves.toBe(EMPTY());
    });
  });

  describe("when accepting using `any`", () => {
    it("will resolve when multiple `any` expressions match", () => {
      const promise = accept({ value, params: { any: ["/v/", "/a/"] } });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve when some `any` expressions match", () => {
      const promise = accept({ value, params: { any: ["/v/", "/123/"] } });

      return expect(promise).resolves.toBe(value);
    });
  });

  describe("when accepting using both `any` and `all`", () => {
    it("will resolve when `any` and `all` agree", () => {
      const promise = accept({
        value,
        params: {
          all: ["/\\w+/"],
          any: ["/z/", "/a/"],
        },
      });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve emptily when `any` and `all` do not agree", () => {
      const promise = accept({
        value,
        params: {
          all: ["/\\w+/"],
          any: ["/z/"],
        },
      });

      return expect(promise).resolves.toBe(EMPTY());
    });
  });
});
