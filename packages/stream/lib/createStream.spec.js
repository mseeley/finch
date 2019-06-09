/* eslint-env jest */
const path = require("path");
const { localNameOf } = require("@finch/core");
const createStream = require("./createStream");

describe(localNameOf(__filename), () => {
  // Relative paths are resolved relative to the resolveFactory helper. We
  // could use a module like `callsite` but, since relative includes are a
  // development/advanced affordance we force the paths to be resolved
  // manually. In the future we might be smarter about this but choosing the
  // correct dirname for resolution will be difficult.
  const operators = `./helpers/__fixtures__/operators`;
  const promiseResolve = `${operators}/promise-resolve`;
  const promiseResolveIdentity = `${operators}/atypical/promise-resolve-identity`;

  it("creates an observable from stages", done => {
    const stages = [{ use: path.resolve(__dirname, promiseResolve) }];
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

  it("provides an empty context", done => {
    const stages = [{ use: path.resolve(__dirname, promiseResolveIdentity) }];
    const context = undefined;
    const expected = {};
    const stream$ = createStream(stages, context);

    stream$.subscribe(
      actual => expect(actual.context).toEqual(expected),
      done.fail,
      done
    );
  });

  it("provides an immutable context object to operators", done => {
    const stages = [{ use: path.resolve(__dirname, promiseResolveIdentity) }];
    const context = { a: true, b: { c: {}, d: {} } };
    const expected = { a: true, b: { c: {}, d: {} } };
    const stream$ = createStream(stages, context);

    // Delete a shallow property.
    delete context.a;

    // Delete a deep property.
    delete context.b.c;

    // Change a deep property
    context.b.d = false;

    // Change a shallow property
    context.a = false;

    stream$.subscribe(
      actual => expect(actual.context).toEqual(expected),
      done.fail,
      done
    );
  });
});
