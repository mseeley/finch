const path = require("path");

module.exports = async function resolvePackagesDir() {
  return path.resolve(process.cwd(), "packages");
};
