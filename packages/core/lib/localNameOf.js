const path = require("path");
const prefix = new RegExp(`.+${path.sep}packages${path.sep}`);
const suffix = /\.js$/;

module.exports = filename =>
  filename
    .replace(prefix, "")
    .replace(suffix, "")
    .replace(path.sep, "/");
