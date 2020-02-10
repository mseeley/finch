/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const split = require("./index");

describe(localNameOf(__filename), () => {
  const tokens = ["1", "2", "3"];
  const glue = "unicorn";
  const pattern = new RegExp(glue, "g");

  it("splits an input stream using a pattern", done => {
    const stream$ = split({
      value: tokens.join(glue),
      params: { pattern: pattern.toString() },
    });

    let i = 0;

    expect.assertions(tokens.length);

    stream$.subscribe(
      part => {
        expect(part).toEqual(tokens[i++]);
      },
      done.fail,
      done
    );
  });

  it("emits an error on bad input", done => {
    const stream$ = split({
      // 3 cannot be split. The value is not serialized.
      value: 3,
      params: { pattern: pattern.toString() },
    });

    stream$.subscribe(null, error => {
      expect(error).toBeInstanceOf(TypeError);
      done();
    });
  });
});
