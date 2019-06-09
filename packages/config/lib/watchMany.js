"use strict";

const assert = require("assert");
const path = require("path");
const { watch } = require("chokidar");
const { Observable } = require("rxjs");
const { readConfig } = require("./helpers");

module.exports = function watchMany({
  dirname,
  glob,
  logger,
  stabilityThreshold = 1000,
}) {
  assert(path.isAbsolute(dirname), `"${dirname}" is not an absolute path`);

  return new Observable(subscriber => {
    const pattern = path.join(dirname, glob);

    let isReady = false;
    let initialConfigs = [];

    const onchange = eventName => {
      return async filename => {
        logger.verbose(`Received "${eventName}" for ${filename}`);

        try {
          // See readConfig for outline of situations where throwing is
          // expected. Read from the file synchronously to prevent races caused
          // file changes occuring in time between the change event and reading
          // file contents.
          const config = await readConfig({ filename, sync: true });

          if (isReady) {
            subscriber.next({ isReady, config });
          } else {
            // Cache all values before ready for nexting once the watcher is
            // ready. This prevents race conditions where side-effects (like
            // unlinking the file) occur when the initial value is nexted.
            initialConfigs.push(config);
          }
        } catch (error) {
          onerror(error);
        }
      };
    };

    const onerror = error => {
      logger.error(error.message);
      subscriber.error(error);
    };

    const onready = () => {
      logger.debug(
        `Ready for changes and emitting initial configs: ${pattern}`
      );

      // This first push indicates that the watcher is ready for side effects on
      // watched pattern to occur during the stream.
      isReady = true;
      subscriber.next({ isReady, config: null });

      initialConfigs.forEach(config => subscriber.next({ isReady, config }));
      initialConfigs = null;
    };

    const options = {
      atomic: true,
      awaitWriteFinish: { stabilityThreshold },
      persistent: true,
    };

    logger.debug(`Preparing to watch: ${pattern}`);

    let watcher = watch(pattern, options)
      .on("add", onchange("add"))
      .on("change", onchange("change"))
      .on("unlink", onchange("unlink"))
      .on("ready", onready)
      .on("error", onerror);

    return function unsubscribe() {
      if (watcher) {
        watcher.close();
        watcher = null;
      }
    };
  });
};
