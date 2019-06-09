/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const validateStages = require("./validateStages");

describe(localNameOf(__filename), () => {
  const use = "module-id";
  const off = use;

  describe("when validating structure", () => {
    it("accepts composite stream", () => {
      const stream = [{ use }, [{ use }, [{ use }]]];

      expect(validateStages(stream)).toBeNull();
    });

    it("requires `use` or `off`", () => {
      expect(validateStages([{}])).toMatchSnapshot();

      expect(validateStages([{ use, off }])).toMatchSnapshot();
    });

    it("requires top-level array contains items", () => {
      expect(validateStages([])).toMatchSnapshot();
    });

    it("rejects additional properties on stream", () => {
      expect(validateStages([{ use, pink: "elephants" }])).toMatchSnapshot();
    });

    it("reports all errors", () => {
      expect(validateStages([{ use: "" }, { use: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `name`", () => {
    it("is optional", () => {
      expect(validateStages([{ use }])).toBeNull();
    });

    it("accepts a string", () => {
      expect(validateStages([{ use, name: "my-name" }])).toBeNull();
    });

    it("must have length", () => {
      expect(validateStages([{ use, name: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `off`", () => {
    it("is optional", () => {
      // `off` is optional when `use` is is provided.
      expect(validateStages([{ use }])).toBeNull();
    });

    it("accepts a string", () => {
      expect(validateStages([{ off }])).toBeNull();
    });

    it("must have length", () => {
      expect(validateStages([{ off: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `params`", () => {
    it("is optional", () => {
      expect(validateStages([{ use }])).toBeNull();
    });

    it("accepts an object", () => {
      expect(validateStages([{ use, params: { a: 1 } }])).toBeNull();
    });

    it("must have at least one property", () => {
      expect(validateStages([{ use, params: {} }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `retryCount`", () => {
    it("is optional", () => {
      expect(validateStages([{ use }])).toBeNull();
    });

    it("accepts a number", () => {
      expect(validateStages([{ use, retryCount: 100 }])).toBeNull();
    });

    it("must be >= 1", () => {
      expect(validateStages([{ use, retryCount: 1 }])).toBeNull();
      expect(validateStages([{ use, retryCount: 0 }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `retryWait`", () => {
    it("is optional", () => {
      expect(validateStages([{ use }])).toBeNull();
    });

    it("accepts a number", () => {
      expect(validateStages([{ use, retryWait: 100 }])).toBeNull();
    });

    it("must be >= 0", () => {
      expect(validateStages([{ use, retryWait: 0 }])).toBeNull();
      expect(validateStages([{ use, retryWait: -1 }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `use`", () => {
    it("is optional", () => {
      // `use` is optional when `off` is is provided.
      expect(validateStages([{ off }])).toBeNull();
    });

    it("accepts a string", () => {
      expect(validateStages([{ use }])).toBeNull();
    });

    it("must have length", () => {
      expect(validateStages([{ use: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `verbose`", () => {
    it("is optional", () => {
      expect(validateStages([{ use }])).toBeNull();
    });

    it("accepts a boolean", () => {
      expect(validateStages([{ use, verbose: true }])).toBeNull();
    });

    it("must be boolean", () => {
      expect(validateStages([{ use, verbose: "true" }])).toMatchSnapshot();
    });
  });
});
