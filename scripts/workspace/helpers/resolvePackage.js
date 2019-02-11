const path = require("path");
const parsePackageName = require("./parsePackageName");
const resolvePackagesDir = require("./resolvePackagesDir");

module.exports = async function resolvePackage({ packageName }) {
  const packagesDir = await resolvePackagesDir();
  const { scope, package } = await parsePackageName({ packageName });

  if (!scope || !package) {
    throw new Error(`Unable to resolve package: ${packageName}`);
  }

  return path.resolve(packagesDir, package);
};
