const assert = require("assert");
const path = require("path");
const picomatch = require("picomatch");
const { defer, EMPTY, throwError } = require("rxjs");
const {
  catchError,
  groupBy,
  mergeMap,
  switchMap,
  takeWhile,
} = require("rxjs/operators");
const readJSON = require("./helpers/readJSON");
const localNameOf = require("./localNameOf");
const log = require("./log");

const localName = `[${localNameOf(__filename)}]`;

// Future:
// - Some specs are difficult to author because there is no indication when a
//   fault tolerant error was received or when all definitions have been
//   transformed into streams.
module.exports = function createStreamFromPath(options = {}, ioc = {}) {
  try {
    const createStream =
      (process.env.NODE_ENV === "test" && ioc.createStream) ||
      require("./createStream");

    const watchFiles =
      (process.env.NODE_ENV === "test" && ioc.watchFiles) ||
      require("./watchFiles");

    const opts = Object.assign({ shouldWatch: false }, options);

    // If the path is a zero-length string, '.' is returned, representing the
    // current working directory.
    const pathname = path.normalize(opts.pathname);
    assert(
      path.isAbsolute(pathname),
      `${localName} Path must be absolute: ${pathname}`
    );

    // Assume we're not being gamed by a directory ending in .json or .ya?ml.
    const { isGlob } = picomatch.scan(pathname);
    const isSingular = !isGlob && /\.(json|ya?ml)$/.test(pathname);
    const isFaultTolerant = !isSingular;
    const pathnames =
      isGlob || isSingular
        ? [pathname]
        : [
            path.join(pathname, "*.json"),
            path.join(pathname, "*.yaml"),
            path.join(pathname, "*.yml"),
          ];

    // The watcher should emit all initial file additions then emit ready. Once
    // ready the watcher is destroyed. This approach ensures consistent glob
    // resolution. The ready event is not filtered when watching files.
    const streamFiles$ = opts.shouldWatch
      ? watchFiles({ pathnames })
      : watchFiles({ pathnames, filterAdd: true, filterReady: true }).pipe(
          takeWhile(watched => watched.event !== "ready")
        );

    // The returned stream will complete when all of its observables complete.
    // Or, when watching, the stream will remain active and await changes to
    // the stream definition files. `streamFiles$` errors should be thrown.
    return streamFiles$.pipe(
      groupBy(watched => watched.filename),
      mergeMap(watched =>
        watched.pipe(
          switchMap(({ present, filename }) => {
            if (!present) {
              // `filename` was removed in watch mode. Wait for the
              // `streamFiles$` observable to indicate the file is again
              // present. The stream for `filename` will wait indefinitely if
              // the file is never again present.
              return EMPTY;
            }

            const readThenCreate$ = defer(() => readJSON({ filename })).pipe(
              switchMap(definitions =>
                createStream({
                  definitions,
                  resolveFrom: path.dirname(filename),
                  shouldWatch: opts.shouldWatch,
                  continueOnError: opts.continueOnError,
                })
              )
            );

            return readThenCreate$.pipe(
              catchError(error => {
                log.error(localName, "Encountered error in:", filename, error);

                // The `createStream` module catches errors thrown by running
                // operators. Errors caught by this module are typically caused
                // by an:
                //
                // - error reading stream definition file.
                // - error resolving stream dependencies.
                //
                // The `createStream` module cannot recover from these errors
                // itself.
                if (opts.shouldWatch) {
                  log(localName, "Will retry after file changed");

                  // This module re-reads then re-creates the stream after the
                  // stream's file changes.
                  return watchFiles({
                    pathnames: [filename],
                    filterChange: true,
                  }).pipe(switchMap(() => readThenCreate$));
                } else if (isFaultTolerant) {
                  log(localName, "Terminating stream for file");

                  // A stream is run in a fault tolerant mode outside of watch
                  // mode when there is a potential for `pathname` to match
                  // multiple stream file definitions.
                  //
                  // In this mode a stream with an unrecoverable error is
                  // terminated gracefully, without affecting other streams.
                  // Reviving this terminated stream requires all streams to be
                  // restarted.
                  //
                  // Your option is:
                  // - running with --watch. The stream will terminate but will
                  // can be revived by changing the stream file or its
                  // dependencies.
                  // - running with --continue. The stream will not terminate.
                  // Instead the stream will drop any value which caused an
                  // operator to throw an unrecoverable error. Operators also
                  // support `retryCount` and `retryWait` options to retry a
                  // failed operator multiple times before throwing an error.
                  return EMPTY;
                } else {
                  log.warn(localName, "Unrecoverable error");

                  return throwError(error);
                }
              })
            );
          })
        )
      )
    );
  } catch (error) {
    return throwError(error);
  }
};
