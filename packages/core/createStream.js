const path = require("path");
const { defer, EMPTY, identity, throwError } = require("rxjs");
const {
  catchError,
  expand,
  first,
  scan,
  skipWhile,
  switchMap,
} = require("rxjs/operators");
const forkObservable = require("./helpers/forkObservable");
const localNameOf = require("./localNameOf");
const log = require("./log");
const resolveStreamDefinition = require("./resolveStreamDefinition");
const watchFiles = require("./watchFiles");

const localName = `[${localNameOf(__filename)}]`;

module.exports = function createStream(options = {}) {
  // Used to trigger a stream dependencies re-resolve after:
  // - a dependency changed or was re-added after being deleted. All deleted
  //   dependencies must be re-added before dependencies are resolved.
  const awaitFirstChange = pathnames =>
    watchFiles({ pathnames, ignoreInitial: true }).pipe(
      scan(
        (state, watched) => {
          // console.log(state, watched);
          // TODO: Log
          switch (watched.event) {
            case "add":
            case "change":
              state.missing.delete(watched.filename);
              state.changed = state.missing.size === 0;
              break;
            case "unlink":
              state.missing.add(watched.filename);
              break;
          }

          return state;
        },
        { changed: false, missing: new Set() }
      ),
      skipWhile(state => !state.changed),
      first()
    );

  const { shouldWatch, ...resolveOptions } = options;

  // Resolve definitions and dependencies. Populate definition defaults.
  const resolveStream$ = defer(() => resolveStreamDefinition(resolveOptions));

  // A `resolveStreamDefinition` failure will terminate the stream when the
  // stream or one of its dependencies fails to resolve, typically through
  // validation failure or missing operator.
  //
  // This module will throw, it's impossible for this module to recover from a
  // resolution failure. Failures post stream definition resolution are handled
  // by this module.
  const streams$ = resolveStream$.pipe(
    shouldWatch
      ? expand(({ dependencies }) => {
          const hasDependencies = dependencies.length > 0;
          const shouldWatchDependencies = shouldWatch && hasDependencies;

          // TODO: Log definition and dependencies counts.
          // console.log("createStream watching", stream.dependencies);

          // Refresh the stream, while watching, after dependency changes.
          return shouldWatchDependencies
            ? awaitFirstChange(dependencies).pipe(
                switchMap(() => {
                  // TODO: Log
                  // console.log("createStream dependency changed");
                  return resolveStream$;
                })
              )
            : EMPTY;
        })
      : identity
  );

  return streams$.pipe(
    switchMap(stream => {
      const { definitions, dependencies } = stream;
      const hasDefinitions = definitions.length > 0;
      const hasDependencies = dependencies.length > 0;
      const isFaultTolerant = shouldWatch && hasDependencies;

      // Empty definitions are handled differently based on situation:
      // - When not watching the stream is completed immediately.
      // - When watching and without dependencies the stream completes
      //   immediately. This prevents a zombie stream.
      // - When watching and with dependencies the stream does not complete.
      //   Instead it remains idle until one of the dependencies changes.
      //
      // Revive the stream, while watching, after:
      // - `runStream$` encountered an error. Currently there is no distinction
      //   between an error thrown by the `forkObservable` helper or by the
      //   observable being executed. The stream is revived once one of the
      //   stream's current dependencies has changed. The expectation is that
      //   the stream failed because of an addressable issue. The stream can
      //   also be revived by `createStreamFromPath`, while watching, when the
      //   stream file itself is touched.
      //
      // The stream is only fault tolerant while watching when there are
      // dependencies. A stream without watched dependencies cannot recover. It
      // is the responsibility of the caller to restart the stream or re-throw
      // these errors.

      return hasDefinitions
        ? forkObservable({
            args: [{ definitions }],
            factory: path.resolve(__dirname, "./createOperators.js"),
            options: { env: process.env },
          }).pipe(
            catchError(error => {
              log.error(localName, "Encountered error:", error);

              if (isFaultTolerant) {
                log(localName, "Ignoring error");

                return EMPTY;
              } else {
                log.warn(localName, "Unrecoverable error");

                return throwError(error);
              }
            })
          )
        : EMPTY;
    })
  );
};
