const path = require("path");
const fs = require("fs-extra");
const getOrgScopeAll = require("./getOrgScopeAll");
const resolvePackagesDir = require("./resolvePackagesDir");
const toOrgScope = require("./toOrgScope");

module.exports = async function findPackagesInScope({ scope } = {}) {
  const packages = [];
  const orgScope = await getOrgScopeAll();

  if (!scope || scope === orgScope) {
    const packagesDir = await resolvePackagesDir();
    const files = await fs.readdir(packagesDir);

    for (let i = 0; i < files.length; i++) {
      const package = path.resolve(packagesDir, files[i]);
      const stats = await fs.stat(package);

      if (stats.isDirectory()) {
        // Assume all directories in packages/ are indeed packages.
        const orgScoped = await toOrgScope({ packageName: files[i] });

        packages.push(orgScoped);
      }
    }
  } else {
    // Assume this is a single @finch/package scope.
    packages.push(scope);
  }

  return packages;
};
