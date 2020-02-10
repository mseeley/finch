/* eslint-env jest */

const { EMPTY, localNameOf } = require("@finch/core");
const ignore = require("./index");

describe(localNameOf(__filename), () => {
  const value = "value";

  describe("when presented improper input", () => {
    it("accepts value if empty parameters are passed", () => {
      const promise = ignore({ value, params: {} });

      return expect(promise).resolves.toBe(value);
    });

    it("accepts value if empty params are passed", () => {
      const promise = ignore({ value, params: { all: [], any: [] } });

      return expect(promise).resolves.toBe(value);
    });
  });

  describe("when ignoring using `pattern`", () => {
    it("resolves emptily when `pattern` matches", () => {
      const promise = ignore({ value, params: { pattern: "/v/" } });

      return expect(promise).resolves.toBe(EMPTY());
    });

    it("disregards `all` when `pattern` is provided", () => {
      // `pattern` should be provided but not match.
      // `any` should be provided and match
      const promise = ignore({
        value,
        params: { pattern: "/foo/", any: ["/v/"] },
      });

      return expect(promise).resolves.toBe(value);
    });

    it("disregards `any` when `pattern` is provided", () => {
      // `pattern` should be provided but not match.
      // `any` should be provided and match
      const promise = ignore({
        value,
        params: { pattern: "/foo/", all: ["/v/"] },
      });

      return expect(promise).resolves.toBe(value);
    });
  });

  describe("when ignoring using `all`", () => {
    it("will resolve emptily when multiple `all` expressions match", () => {
      const promise = ignore({ value, params: { all: ["/v/", "/a/"] } });

      return expect(promise).resolves.toBe(EMPTY());
    });

    it("will resolve if every `all` expression does not match", () => {
      const promise = ignore({ value, params: { all: ["/v/", "/123/"] } });

      return expect(promise).resolves.toBe(value);
    });
  });

  describe("when ignoring using `any`", () => {
    it("will resolve emptily when multiple `any` expressions match", () => {
      const promise = ignore({ value, params: { any: ["/v/", "/a/"] } });

      return expect(promise).resolves.toBe(EMPTY());
    });

    it("will resolve emptily when some `any` expressions match", () => {
      const promise = ignore({ value, params: { any: ["/v/", "/123/"] } });

      return expect(promise).resolves.toBe(EMPTY());
    });
  });

  describe("when ignoring using both `any` and `all`", () => {
    it("will resolve emptily when `any` and `all` agree", () => {
      const promise = ignore({
        value,
        params: {
          all: ["/\\w+/"],
          any: ["/z/", "/a/"],
        },
      });

      return expect(promise).resolves.toBe(EMPTY());
    });

    it("will not reject when `any` and `all` do not agree", () => {
      const promise = ignore({
        value,
        params: {
          all: ["/\\w+/"],
          any: ["/z/"],
        },
      });

      expect(promise).resolves.toBe(value);
    });
  });
});
