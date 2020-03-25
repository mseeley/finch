/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const stringify = require("./index");

describe(localNameOf(__filename), () => {
  const cyclic = {};
  cyclic.a = cyclic;

  test.each([3, null, undefined])("follows JSON semantics for %s", (value) => {
    return expect(stringify({ value, params: {} })).resolves.toBe(
      JSON.stringify(value)
    );
  });

  it("rejects if the value is not serializable", () => {
    return expect(
      stringify({ value: cyclic, params: {} })
    ).rejects.toBeInstanceOf(TypeError);
  });

  it("accepts an optional replacer", async () => {
    const replacer = (key, value) => (key === "a" ? "redacted" : value);

    const result = await stringify({ value: cyclic, params: { replacer } });

    expect(result).toMatchInlineSnapshot(`"{\\"a\\":\\"redacted\\"}"`);
  });

  it("accepts an optional indentation amout", async () => {
    const value = {
      top: {
        middle: {
          bottom: {},
        },
      },
    };

    const result = await stringify({ value, params: { space: 2 } });

    expect(result).toMatchInlineSnapshot(`
      "{
        \\"top\\": {
          \\"middle\\": {
            \\"bottom\\": {}
          }
        }
      }"
    `);
  });
});
