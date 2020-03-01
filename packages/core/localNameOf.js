const path = require("path");
const prefix = new RegExp(`.+${path.sep}(packages|@finch)${path.sep}`);
const suffix = /\.js$/;

// Future: This could be made more useful to other users too. If it's not a
// package then show the parentdirectory/filename as the local name. Or, better,
// just have two helpers. One for packages and one of not packages. or, maybe
// best just teach the logger to accept a __filename and run this work on its
// own. It ould even find the nearest package.json and use that in lieu of the
// packages directory sniffing. Yeah that's nice. Find the nearest package json
// or just show the file name. @finch/cli/start

module.exports = function localNameOf(filename) {
  return filename
    .replace(prefix, "")
    .replace(suffix, "")
    .replace(path.sep, "/");
};
