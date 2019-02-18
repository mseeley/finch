"use strict";

const { createLogger, format, transports } = require("winston");
const { localNameOf } = require("@finch/core");

const logger = createLogger({
  exitOnError: false,
  format: format.combine(
    format.timestamp(),
    format.printf(info =>
      info.label
        ? `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
        : `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  level: "debug",
  transports: [new transports.Console()]
});

module.exports = function index(prefix) {
  const label = typeof prefix === "string" && localNameOf(prefix);

  return logger.child({ label });
};
