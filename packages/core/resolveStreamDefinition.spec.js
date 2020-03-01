/* eslint-env jest */

const path = require("path");
const localNameOf = require("./localNameOf");
const resolveStreamDefinition = require("./resolveStreamDefinition");

describe(localNameOf(__filename), () => {
  function fixtures(file = "") {
    return path.join(
      __dirname,
      "__fixtures__",
      "resolveStreamDefinition",
      file
    );
  }

  it("recursively resolves definitions and dependencies", () => {
    return expect(
      resolveStreamDefinition({
        definitions: [
          // Paths are relative to `./__fixtures__/resolveStreamDefinition`.
          { use: "./operator-a.js" },
          { include: "./include-multiple.json" },
        ],
        resolveFrom: fixtures(),
      })
    ).resolves.toEqual({
      definitions: [
        { use: fixtures("operator-a.js") },
        // Provided by include-multiple.json.
        { use: fixtures("operator-b.js") },
        // Provided by include-one.json.
        { use: fixtures("operator-c.js") },
      ],
      dependencies: [
        // All file operators and file includes are identified as dependencies.
        fixtures("operator-a.js"),
        fixtures("include-multiple.json"),
        fixtures("operator-b.js"),
        fixtures("include-one.json"),
        fixtures("operator-c.js"),
      ],
    });
  });

  it("resolves mixture of local files and node modules", () => {
    // Although the `@finch/core` module is not an operator it's used here to
    // keep node's module resolution contained within the core module.
    return expect(
      resolveStreamDefinition({
        definitions: [{ use: "@finch/core" }, { use: "./operator-a.js" }],
        resolveFrom: fixtures(),
      })
    ).resolves.toEqual({
      definitions: [{ use: "@finch/core" }, { use: fixtures("operator-a.js") }],
      dependencies: [fixtures("operator-a.js")],
    });
  });

  it("resolves mixture of used and ignored operators", () => {
    // Although the `@finch/core` module is not an operator it's used here to
    // keep node's module resolution contained within the core module.
    return expect(
      resolveStreamDefinition({
        definitions: [{ use: "@finch/core" }, { ignore: "./operator-a.js" }],
        resolveFrom: fixtures(),
      })
    ).resolves.toEqual({
      definitions: [{ use: "@finch/core" }],
      dependencies: [],
    });
  });

  it("can resolve absolute local files without resolveFrom", () => {
    return expect(
      resolveStreamDefinition({
        definitions: [{ use: fixtures("operator-a.js") }],
      })
    ).resolves.toEqual({
      definitions: [{ use: fixtures("operator-a.js") }],
      dependencies: [fixtures("operator-a.js")],
    });
  });

  it("throws when a node module is missing", () => {
    const use = "@finch/i-do-not-exist";
    const definition = { use };

    return expect(
      resolveStreamDefinition({ definitions: [definition] })
    ).rejects.toThrow(
      `${JSON.stringify(definition)} is invalid: cannot find ${use}`
    );
  });

  it("throws when a relative local file is missing", () => {
    const use = "./operator-does-not-exist.js";
    const definition = { use };
    const resolveFrom = fixtures();

    return expect(
      resolveStreamDefinition({ definitions: [definition], resolveFrom })
    ).rejects.toThrow(
      `${JSON.stringify(
        definition
      )} is invalid: cannot find ${use} from ${resolveFrom}`
    );
  });

  it("throws when an absolute local file is missing", () => {
    const use = fixtures("/operator-does-not-exist.js");
    const definition = { use };

    return expect(
      resolveStreamDefinition({ definitions: [definition] })
    ).rejects.toThrow(
      `${JSON.stringify(definition)} is invalid: cannot find ${use}`
    );
  });

  it("throws when resolveFromOption is invalid", () => {
    return expect(
      resolveStreamDefinition({
        definitions: [{ use: "./operator-a.js" }],
        resolveFrom: "./__fixtures__",
      })
    ).rejects.toThrow("`resolveFrom` must be undefined or an absolute path");
  });

  it("throws when definition is invalid", () => {
    return expect(
      resolveStreamDefinition({
        definitions: [{ use: "./operator-a.js", ignore: "./operator-a.js" }],
        resolveFrom: fixtures(),
      })
    ).rejects.toThrow(
      `{"use":"./operator-a.js","ignore":"./operator-a.js"} is invalid`
    );
  });

  it("throws when a dependency file cannot be read", () => {
    const include = fixtures("include-invalid-syntax.json");

    return expect(
      resolveStreamDefinition({ definitions: [{ include }] })
    ).rejects.toThrow(
      `Parse error ${include}: Unexpected token / in JSON at position 0`
    );
  });

  describe("when settings `continueOnError`", () => {
    it("has no default value", async () => {
      const use = fixtures("operator-a.js");
      let resolved;

      // There is no default value for continueOneError.
      resolved = await resolveStreamDefinition({ definitions: [{ use }] });
      expect(resolved.definitions[0].continueOnError).toBeUndefined();

      resolved = await resolveStreamDefinition({
        definitions: [{ use }],
        continueOnError: true,
      });
      expect(resolved.definitions[0].continueOnError).toBe(true);

      resolved = await resolveStreamDefinition({
        definitions: [{ use }],
        continueOnError: false,
      });
      expect(resolved.definitions[0].continueOnError).toBe(false);
    });

    it("will not overwrite an existing value", async () => {
      const use = fixtures("operator-a.js");
      let resolved;

      resolved = await resolveStreamDefinition({
        definitions: [{ use, continueOnError: true }],
        continueOnError: false,
      });
      expect(resolved.definitions[0].continueOnError).toBe(true);

      resolved = await resolveStreamDefinition({
        definitions: [{ use, continueOnError: false }],
        continueOnError: true,
      });
      expect(resolved.definitions[0].continueOnError).toBe(false);
    });

    it("passes option to includes", async () => {
      let resolved;

      resolved = await resolveStreamDefinition({
        definitions: [{ include: fixtures("./include-one.json") }],
        continueOnError: false,
      });
      expect(resolved.definitions[0].continueOnError).toBe(false);

      resolved = await resolveStreamDefinition({
        definitions: [{ include: fixtures("./include-one.json") }],
        continueOnError: true,
      });
      expect(resolved.definitions[0].continueOnError).toBe(true);
    });
  });
});
