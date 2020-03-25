const { localNameOf } = require("@finch/core");
const { EMPTY, defer, from, of, throwError } = require("rxjs");
const { delay, expand, mergeMap, repeat } = require("rxjs/operators");

const localName = localNameOf(__filename);

const stepIterator = (iterator) =>
  defer(() => of(iterator.next())).pipe(
    mergeMap((result) => (result.done ? EMPTY : of(result.value)))
  );

module.exports = ({ params }) => {
  const { delay: delayMilliseconds, times = 1, values } = params;
  const isIterable =
    values != null && typeof values[Symbol.iterator] === "function";

  if (!isIterable) {
    return throwError(new Error(`${localName}: \`${values}\` is not iterable`));
  }

  // Iterable values which are emitted over time are handled manually. Otherwise
  // the values are provided to Rx for resolution. Values are always yielded
  // asynchronously, even when `delay <= 0`, to avoid exceeding callstack size
  // when repeating indefinitely and not using a delay.
  //
  // There's a commented out spec that illustrates the range error. The error
  // will be thrown when `from(values)` does not pipe through `delay(0)`. The
  // spec and Rx failures are uncatchable.
  //
  // See: https://github.com/ReactiveX/rxjs/issues/651
  // See: https://github.com/ReactiveX/rxjs/issues/2341
  const observable =
    delayMilliseconds > 0
      ? defer(() => of(values[Symbol.iterator]())).pipe(
          mergeMap((iterator) =>
            stepIterator(iterator).pipe(
              expand((v) =>
                stepIterator(iterator).pipe(delay(delayMilliseconds))
              )
            )
          )
        )
      : from(values).pipe(delay(0));

  return observable.pipe(repeat(times));
};
