/* eslint-env jest */
const path = require("path");
const { localNameOf } = require("@finch/core");
const createStream = require("./createStream");

describe(localNameOf(__filename), () => {
  it("creates an observable from stages", done => {
    // Relative paths are resolved relative to the resolveFactory helper. We
    // could use a module like `callsite` but, since relative includes are a
    // development/advanced affordance we force the paths to be resolved
    // manually. In the future we might be smarter about this but choosing the
    // correct dirname for resolution will be difficult.
    const use = "./helpers/__fixtures__/operators/promise-resolve";
    const stages = [{ use: path.resolve(__dirname, use) }];

    const stream$ = createStream(stages);

    stream$.subscribe(
      function(value) {
        // The stream is always primed with an undefined value. It's assumed the
        // value is throwaway and a real value is provided by an emitter.
        expect(value).toBeUndefined();
        expect(arguments).toHaveLength(1);
      },
      done.fail,
      done
    );
  });
});
