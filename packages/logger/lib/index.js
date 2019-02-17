"use strict";

const path = require("path");
const { createLogger, format, transports } = require("winston");

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
  let label;

  if (typeof prefix === "string") {
    const sep = path.sep;
    const packageDirectory = new RegExp(`${sep}packages${sep}([^${sep}]+)`);
    const matches = prefix.match(packageDirectory);

    label = (matches && matches[1]) || prefix;
  }

  return logger.child({ label });
};
