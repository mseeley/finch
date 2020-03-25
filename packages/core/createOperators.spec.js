/* eslint-env jest */

const path = require("path");
const createOperators = require("./createOperators");
const localNameOf = require("./localNameOf");

describe(localNameOf(__filename), () => {
  function fixtures(filename) {
    return path.join(__dirname, "__fixtures__", "createOperators", filename);
  }

  it("creates an observable sequence of operators", (done) => {
    const definitions = [
      { use: fixtures("count-to-three") },
      { use: fixtures("add-10") },
    ];

    const expected = [11, 12, 13];

    expect.assertions(expected.length);

    createOperators({ definitions }).subscribe(
      (value) => {
        expect(value).toEqual(expected.shift());
      },
      done,
      done
    );
  });

  it("initiates the observable sequence with an `undefined` value", (done) => {
    const definitions = [{ use: fixtures("async-resolve-identity") }];

    // The first operator in the sequence receives a undefined value.
    const expected = [{ params: {}, value: undefined }];

    expect.assertions(expected.length);

    createOperators({ definitions }).subscribe(
      (value) => {
        expect(value).toEqual(expected.shift());
      },
      done,
      done
    );
  });
});
