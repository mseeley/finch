"use strict";

const { createLogger, format, transports } = require("winston");

const logger = createLogger({
  // The logger should not be in charge of exiting after an uncaught error.
  exitOnError: false,
  format: format.combine(
    format.timestamp(),
    format.printf(info =>
      info.prefix
        ? `${info.timestamp} [${info.prefix}] ${info.level}: ${info.message}`
        : `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  level: "debug",
  transports: [new transports.Console()]
});

module.exports = meta => logger.child(meta);
