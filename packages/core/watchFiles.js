const assert = require("assert");
const fs = require("fs");
const path = require("path");
const picomatch = require("picomatch");
const { Observable } = require("rxjs");
const localNameOf = require("./localNameOf");

const localName = `[${localNameOf(__filename)}]`;

// Ignore all dot file and dot directories. Also ignore all node_modules
// directories. Also ignore any `package.json` as a node project this seems like
// a sensible default.
const ignored = [
  /(^|[/\\])\../,
  /[/\\]node_modules[/\\]/,
  /[/\\]package\.json$/,
  /[/\\]package-lock\.json$/,
];

function assertOptions(options) {
  const { pathnames } = options;
  const message = `${localName} One or more absolute paths are required`;

  assert(Array.isArray(pathnames), message);
  assert(pathnames.length > 0, message);
  assert(
    pathnames.every((pathname) => path.isAbsolute(pathname)),
    message
  );

  // Watching of pathnames before they exist is handled inconsistently by
  // Chokidar v3.3.0, at least on macOS 10.15.2 and node 10.17.0. In manual
  // testing via Finder it's possible to see Chokidar correctly event as the
  // missing file and or directory are created. Although when running through
  // Jest the same steps of creating a missing file and/or parent directory
  // _inconsistently_ trigger "add" events. Loosening Chockidar's `atomic` and
  // `awaitWriteFinish` safety did not help.
  //
  // Consistent behavior requires:
  // - the glob pattern's base exists.
  // - a non-glob pattern pathname exists.
  for (const pathname of pathnames) {
    const result = picomatch.scan(pathname);
    const requiredPath = result.isGlob ? result.base : pathname;

    assert(
      fs.existsSync(requiredPath),
      `${localName} Path must exist: ${requiredPath}`
    );
  }
}

module.exports = function watchFiles(options = {}, ioc = {}) {
  // De-reference `options`; no shenanigans.
  const opts = { ...options };

  const { watch } =
    process.env.NODE_ENV === "test" && ioc.watch ? ioc : require("chokidar");

  let { filterAdd, filterChange, filterUnlink } = opts;

  if (!filterAdd && !filterChange && !filterUnlink) {
    // Omitting filterAdd, filterChange, and filterUnlink results in all
    // non-ready events being filtered.
    filterAdd = filterChange = filterUnlink = true;
  }

  return new Observable((observer) => {
    const stabilityThreshold = Number(process.env.FINCH_STABILITY_THRESHOLD);

    let watcher;
    let onAll;
    let onError;
    let onReady;

    try {
      assertOptions(opts);

      onAll = (event, filename) => {
        // TODO: Debug logging.
        // console.log("watchFiles", event, filename);
        const present = event !== "unlink";

        if (
          (event === "add" && filterAdd) ||
          (event === "change" && filterChange) ||
          (event === "unlink" && filterUnlink)
        ) {
          // Be aware that nexting a observer may synchronously unsubscribe.
          observer.next({ event, filename, present });
        }
      };

      onError = (error) => {
        observer.error(error);
      };

      onReady = (...args) => {
        if (opts.filterReady) {
          observer.next({ event: "ready" });
        }
      };

      watcher = watch(opts.pathnames, {
        atomic: true,
        awaitWriteFinish:
          stabilityThreshold >= 0 ? { stabilityThreshold } : true,
        ignored,
        // There's no need to provide initial adds if adds are not filtered.
        ignoreInitial: filterAdd && Boolean(opts.ignoreInitial),
        persistent: true,
      });

      watcher.on("all", onAll);
      watcher.on("error", onError);
      watcher.on("ready", onReady);
    } catch (error) {
      observer.error(error);
    }

    // TODO: Log. "watchFiles: subscribe()", opts.pathnames
    return function unsubscribe() {
      if (watcher) {
        // TODO: Watchers should have unique IDs logged.
        // TODO: Log. "watchFiles: unsubscribe()", opts.pathnames
        // TODO: Include logging that indicates when a logger is created and
        // destroyed. ID individual watchers.

        // Synchronously unsubscribe from events then asynchronously close the
        // watcher.
        watcher.off("all", onAll);
        watcher.off("error", onError);
        watcher.off("ready", onReady);
        watcher.close();
        watcher = null;
      }
    };
  });
};
