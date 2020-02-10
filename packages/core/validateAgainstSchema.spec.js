/* eslint-env jest */

const localNameOf = require("./localNameOf");
const validateAgainstSchema = require("./validateAgainstSchema");

describe(localNameOf(__filename), () => {
  const use = "module-id";
  const ignore = use;
  const include = use;

  describe("when validating stream.json", () => {
    describe("when validating structure", () => {
      it("requires array of operator definitions", () => {
        expect(validateAgainstSchema("stream.json", ["foobar"]))
          .toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should be object",
              ],
              "pointer": "/0",
            },
          ]
        `);
      });

      it("requires top-level array contains items", () => {
        expect(validateAgainstSchema("stream.json", [])).toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should NOT have fewer than 1 items",
              ],
              "pointer": "",
            },
          ]
        `);
      });

      it("reports all errors", () => {
        expect(
          validateAgainstSchema("stream.json", [{ use: "" }, { include: "" }])
        ).toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should NOT be shorter than 1 characters",
              ],
              "pointer": "/0/use",
            },
            Object {
              "errors": Array [
                "should NOT be shorter than 1 characters",
              ],
              "pointer": "/1/include",
            },
          ]
        `);
      });
    });
  });

  describe("when validating operator.json", () => {
    describe("when validating structure", () => {
      // Prevent `include` and all other operator members.
      test.each(
        Object.entries({
          use,
          ignore,
          continueOnError: true,
          params: {},
          retryCount: 1,
          retryWait: 1000,
        })
      )("prevents `include` and `%s", (key, value) => {
        expect(
          validateAgainstSchema("operator.json", { include, [key]: value })
        ).toEqual([
          {
            errors: ["should NOT be valid"],
            pointer: "",
          },
        ]);
      });

      it("prevents `use` and `ignore`", () => {
        expect(validateAgainstSchema("operator.json", { use, ignore }))
          .toMatchInlineSnapshot(`
                  Array [
                    Object {
                      "errors": Array [
                        "should NOT be valid",
                      ],
                      "pointer": "",
                    },
                  ]
              `);
      });

      it("requires `use` or `ignore` or `include", () => {
        expect(validateAgainstSchema("operator.json", {}))
          .toMatchInlineSnapshot(`
                  Array [
                    Object {
                      "errors": Array [
                        "should have required property 'include'",
                        "should have required property 'ignore'",
                        "should have required property 'use'",
                        "should match some schema in anyOf",
                      ],
                      "pointer": "",
                    },
                  ]
              `);
      });

      it("rejects additional properties", () => {
        expect(
          validateAgainstSchema("operator.json", { use, pink: "elephants" })
        ).toMatchInlineSnapshot(`
                  Array [
                    Object {
                      "errors": Array [
                        "should NOT have additional properties: pink",
                      ],
                      "pointer": "",
                    },
                  ]
              `);
      });
    });

    describe("when validating operator `include`", () => {
      it("is optional", () => {
        // `include` is optional when `use` or `ignore` are provided.
        expect(validateAgainstSchema("operator.json", { use })).toBeNull();
        expect(validateAgainstSchema("operator.json", { ignore })).toBeNull();
      });

      it("accepts a string", () => {
        expect(validateAgainstSchema("operator.json", { include })).toBeNull();
      });

      it("must have length", () => {
        expect(validateAgainstSchema("operator.json", { include: "" }))
          .toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should NOT be shorter than 1 characters",
              ],
              "pointer": "/include",
            },
          ]
        `);
      });
    });

    describe("when validating operator `ignore`", () => {
      it("is optional", () => {
        // `ignore` is optional when `include` or `use` is is provided.
        expect(validateAgainstSchema("operator.json", { include })).toBeNull();
        expect(validateAgainstSchema("operator.json", { use })).toBeNull();
      });

      it("accepts a string", () => {
        expect(validateAgainstSchema("operator.json", { ignore })).toBeNull();
      });

      it("must have length", () => {
        expect(validateAgainstSchema("operator.json", { ignore: "" }))
          .toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should NOT be shorter than 1 characters",
              ],
              "pointer": "/ignore",
            },
          ]
        `);
      });
    });

    describe("when validating operator `params`", () => {
      it("is optional", () => {
        expect(validateAgainstSchema("operator.json", { use })).toBeNull();
      });

      it("accepts an object", () => {
        expect(
          validateAgainstSchema("operator.json", { use, params: { a: 1 } })
        ).toBeNull();
      });

      it("accepts an empty object", () => {
        expect(
          validateAgainstSchema("operator.json", { use, params: {} })
        ).toBeNull();
      });
    });

    describe("when validating operator `retryCount`", () => {
      it("is optional", () => {
        expect(validateAgainstSchema("operator.json", { use })).toBeNull();
      });

      it("accepts a number", () => {
        expect(
          validateAgainstSchema("operator.json", { use, retryCount: 100 })
        ).toBeNull();
      });

      it("must be >= 1", () => {
        expect(
          validateAgainstSchema("operator.json", { use, retryCount: 1 })
        ).toBeNull();
        expect(validateAgainstSchema("operator.json", { use, retryCount: 0 }))
          .toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should be >= 1",
              ],
              "pointer": "/retryCount",
            },
          ]
        `);
      });
    });

    describe("when validating operator `retryWait`", () => {
      it("is optional", () => {
        expect(validateAgainstSchema("operator.json", { use })).toBeNull();
      });

      it("accepts a number", () => {
        expect(
          validateAgainstSchema("operator.json", { use, retryWait: 100 })
        ).toBeNull();
      });

      it("must be >= 0", () => {
        expect(
          validateAgainstSchema("operator.json", { use, retryWait: 0 })
        ).toBeNull();
        expect(validateAgainstSchema("operator.json", { use, retryWait: -1 }))
          .toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should be >= 0",
              ],
              "pointer": "/retryWait",
            },
          ]
        `);
      });
    });

    describe("when validating operator `use`", () => {
      it("is optional", () => {
        // `use` is optional when `include` or `ignore` is is provided.
        expect(validateAgainstSchema("operator.json", { include })).toBeNull();
        expect(validateAgainstSchema("operator.json", { ignore })).toBeNull();
      });

      it("accepts a string", () => {
        expect(validateAgainstSchema("operator.json", { use })).toBeNull();
      });

      it("must have length", () => {
        expect(validateAgainstSchema("operator.json", { use: "" }))
          .toMatchInlineSnapshot(`
          Array [
            Object {
              "errors": Array [
                "should NOT be shorter than 1 characters",
              ],
              "pointer": "/use",
            },
          ]
        `);
      });
    });
  });
});
