/* eslint-env jest */

const AssertionError = require("assert").AssertionError;
const { localNameOf } = require("@finch/core");
const { empty } = require("@finch/stream");
const blacklist = require("./index");

describe(localNameOf(__filename), () => {
  const value = "value";

  describe("when presented improper input", () => {
    it("rejects if `any` is not a regular expression", () => {
      const promise = blacklist({ value, params: { any: 123 } });

      return expect(promise).rejects.toThrow(AssertionError);
    });

    it("rejects if `all` is not a regular expression", () => {
      const promise = blacklist({ value, params: { all: 123 } });

      return expect(promise).rejects.toThrow(AssertionError);
    });

    it("rejects if no parameters are passed", () => {
      const promise = blacklist({ value });

      return expect(promise).rejects.toThrow(AssertionError);
    });

    it("rejects if empty params are passed", () => {
      const promise = blacklist({ value, params: { all: [], any: [] } });

      return expect(promise).rejects.toThrow(AssertionError);
    });
  });

  describe("when blacklisting using `all`", () => {
    it("will resolve emptily when single `all` expression matches", () => {
      const promise = blacklist({ value, params: { all: /v/ } });

      return expect(promise).resolves.toBe(empty());
    });

    it("will resolve emptily when multiple `all` expressions match", () => {
      const promise = blacklist({ value, params: { all: [/v/, /a/] } });

      return expect(promise).resolves.toBe(empty());
    });

    it("will resolve if every `all` expression does not match", () => {
      const promise = blacklist({ value, params: { all: [/v/, /123/] } });

      return expect(promise).resolves.toBe(value);
    });
  });

  describe("when blacklisting using `any`", () => {
    it("will resolve emptily when single `any` expression matches", () => {
      const promise = blacklist({ value, params: { any: /v/ } });

      return expect(promise).resolves.toBe(empty());
    });

    it("will resolve emptily when multiple `any` expressions match", () => {
      const promise = blacklist({ value, params: { any: [/v/, /a/] } });

      return expect(promise).resolves.toBe(empty());
    });

    it("will resolve emptily when some `any` expressions match", () => {
      const promise = blacklist({ value, params: { any: [/v/, /123/] } });

      return expect(promise).resolves.toBe(empty());
    });
  });

  describe("when blacklisting using both `any` and `all`", () => {
    it("will resolve emptily when `any` and `all` agree", () => {
      const promise = blacklist({
        value,
        params: {
          all: [/\w+/],
          any: [/z/, /a/]
        }
      });

      return expect(promise).resolves.toBe(empty());
    });

    it("will not reject when `any` and `all` do not agree", () => {
      const promise = blacklist({
        value,
        params: {
          all: [/\w+/],
          any: [/z/]
        }
      });

      expect(promise).resolves.toBe(value);
    });
  });
});
