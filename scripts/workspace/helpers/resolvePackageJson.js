const path = require("path");
const resolvePackage = require("./resolvePackage");

module.exports = async function resolvePackageJson({ packageName }) {
  const package = await resolvePackage({ packageName });

  return path.resolve(package, "package.json");
};
