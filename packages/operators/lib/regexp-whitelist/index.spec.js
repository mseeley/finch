/* eslint-env jest */

const AssertionError = require("assert").AssertionError;
const { localNameOf } = require("@finch/core");
const { empty } = require("@finch/stream");
const whitelist = require("./index");

describe(localNameOf(__filename), () => {
  const value = "value";

  describe("when presented improper input", () => {
    it("rejects if `any` is not a regular expression", () => {
      const promise = whitelist({ value, params: { any: 123 } });

      return expect(promise).rejects.toThrow(AssertionError);
    });

    it("rejects if `all` is not a regular expression", () => {
      const promise = whitelist({ value, params: { all: 123 } });

      return expect(promise).rejects.toThrow(AssertionError);
    });

    it("rejects if no parameters are passed", () => {
      const promise = whitelist({ value });

      return expect(promise).rejects.toThrow(AssertionError);
    });

    it("rejects if empty params are passed", () => {
      const promise = whitelist({ value, params: { all: [], any: [] } });

      return expect(promise).rejects.toThrow(AssertionError);
    });
  });

  describe("when whitelisting using `all`", () => {
    it("will resolve when single `all` expression matches", () => {
      const promise = whitelist({ value, params: { all: /v/ } });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve when multiple `all` expressions match", () => {
      const promise = whitelist({ value, params: { all: [/v/, /a/] } });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve emptily if every `all` expression does not match", () => {
      const promise = whitelist({ value, params: { all: [/v/, /123/] } });

      return expect(promise).resolves.toBe(empty());
    });
  });

  describe("when whitelisting using `any`", () => {
    it("will resolve when single `any` expression matches", () => {
      const promise = whitelist({ value, params: { any: /v/ } });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve when multiple `any` expressions match", () => {
      const promise = whitelist({ value, params: { any: [/v/, /a/] } });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve when some `any` expressions match", () => {
      const promise = whitelist({ value, params: { any: [/v/, /123/] } });

      return expect(promise).resolves.toBe(value);
    });
  });

  describe("when whitelisting using both `any` and `all`", () => {
    it("will resolve when `any` and `all` agree", () => {
      const promise = whitelist({
        value,
        params: {
          all: [/\w+/],
          any: [/z/, /a/]
        }
      });

      return expect(promise).resolves.toBe(value);
    });

    it("will resolve emptily when `any` and `all` do not agree", () => {
      const promise = whitelist({
        value,
        params: {
          all: [/\w+/],
          any: [/z/]
        }
      });

      return expect(promise).resolves.toBe(empty());
    });
  });
});
