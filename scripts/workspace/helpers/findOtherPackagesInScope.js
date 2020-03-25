const findPackagesInScope = require("./findPackagesInScope");

module.exports = async function findOtherPackagesInScope({
  packageName,
  scope,
}) {
  const packages = await findPackagesInScope({ scope });
  return packages.filter((p) => p !== packageName);
};
