/* eslint-env jest */

const path = require("path");
const { localNameOf } = require("../index");
const readJSON = require("./readJSON");

describe(localNameOf(__filename), () => {
  const fixtures = (file = "") =>
    path.resolve(__dirname, "__fixtures__", "readJSON", file);

  test.each(["object.json", "object.yaml", "object.yml"])(
    "accepts file containing single object: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual({ hello: "world" });
    }
  );

  test.each(["empty-object.json", "empty-object.yaml", "empty-object.yml"])(
    "accepts file containing empty object: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual({});
    }
  );

  test.each(["empty-array.json", "empty-array.yaml", "empty-array.yml"])(
    "accepts file containing empty array: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual([]);
    }
  );

  test.each(["object-array.json", "object-array.yaml", "object-array.yml"])(
    "accepts file containing array of objects: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual([{ hello: "world" }]);
    }
  );

  test.each([
    "empty.json",
    "empty.yaml",
    "empty.yml",
    "comment-only.yaml",
    "comment-only.yml",
  ])("returns `null` file without key/value pairs: %s", async file => {
    const data = await readJSON({ filename: fixtures(file) });

    expect(data).toEqual(null);
  });

  test.each(["string.json", "string.yaml", "string.yml"])(
    "returns string value: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual("hello world");
    }
  );

  test.each(["number.json", "number.yaml", "number.yml"])(
    "returns numeric value: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual(42);
    }
  );

  test.each(["boolean.json", "boolean.yaml", "boolean.yml"])(
    "returns boolean value: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual(true);
    }
  );

  test.each(["null.json", "null.yaml", "null.yml"])(
    "returns null value: %s",
    async file => {
      const data = await readJSON({ filename: fixtures(file) });

      expect(data).toEqual(null);
    }
  );

  test.each([
    "invalid-syntax.json",
    "invalid-syntax.yaml",
    "invalid-syntax.yml",
  ])("throws when configuration has invalid syntax: %s", file =>
    expect(readJSON({ filename: fixtures(file) })).rejects.toThrow(
      "Parse error"
    )
  );
});
