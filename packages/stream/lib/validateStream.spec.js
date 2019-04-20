/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const validateStream = require("./validateStream");

describe(localNameOf(__filename), () => {
  const use = "module-id";
  const off = use;

  describe("when validating structure", () => {
    it("accepts composite stream", () => {
      const stream = [{ use }, [{ use }, [{ use }]]];

      expect(validateStream(stream)).toBeNull();
    });

    it("requires `use` or `off`", () => {
      expect(validateStream([{}])).toMatchSnapshot();

      expect(validateStream([{ use, off }])).toMatchSnapshot();
    });

    it("requires top-level array contains items", () => {
      expect(validateStream([])).toMatchSnapshot();
    });

    it("rejects additional properties on stream", () => {
      expect(validateStream([{ use, pink: "elephants" }])).toMatchSnapshot();
    });

    it("reports all errors", () => {
      expect(validateStream([{ use: "" }, { use: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `name`", () => {
    it("is optional", () => {
      expect(validateStream([{ use }])).toBeNull();
    });

    it("accepts a string", () => {
      expect(validateStream([{ use, name: "my-name" }])).toBeNull();
    });

    it("must have length", () => {
      expect(validateStream([{ use, name: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `off`", () => {
    it("is optional", () => {
      // `off` is optional when `use` is is provided.
      expect(validateStream([{ use }])).toBeNull();
    });

    it("accepts a string", () => {
      expect(validateStream([{ off }])).toBeNull();
    });

    it("must have length", () => {
      expect(validateStream([{ off: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `params`", () => {
    it("is optional", () => {
      expect(validateStream([{ use }])).toBeNull();
    });

    it("accepts an object", () => {
      expect(validateStream([{ use, params: { a: 1 } }])).toBeNull();
    });

    it("must have at least one property", () => {
      expect(validateStream([{ use, params: {} }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `retryCount`", () => {
    it("is optional", () => {
      expect(validateStream([{ use }])).toBeNull();
    });

    it("accepts a number", () => {
      expect(validateStream([{ use, retryCount: 100 }])).toBeNull();
    });

    it("must be >= 1", () => {
      expect(validateStream([{ use, retryCount: 1 }])).toBeNull();
      expect(validateStream([{ use, retryCount: 0 }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `retryWait`", () => {
    it("is optional", () => {
      expect(validateStream([{ use }])).toBeNull();
    });

    it("accepts a number", () => {
      expect(validateStream([{ use, retryWait: 100 }])).toBeNull();
    });

    it("must be >= 0", () => {
      expect(validateStream([{ use, retryWait: 0 }])).toBeNull();
      expect(validateStream([{ use, retryWait: -1 }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `use`", () => {
    it("is optional", () => {
      // `use` is optional when `off` is is provided.
      expect(validateStream([{ off }])).toBeNull();
    });

    it("accepts a string", () => {
      expect(validateStream([{ use }])).toBeNull();
    });

    it("must have length", () => {
      expect(validateStream([{ use: "" }])).toMatchSnapshot();
    });
  });

  describe("when validating stream `verbose`", () => {
    it("is optional", () => {
      expect(validateStream([{ use }])).toBeNull();
    });

    it("accepts a boolean", () => {
      expect(validateStream([{ use, verbose: true }])).toBeNull();
    });

    it("must be boolean", () => {
      expect(validateStream([{ use, verbose: "true" }])).toMatchSnapshot();
    });
  });
});
