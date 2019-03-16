const path = require("path");
const resolvePackage = require("./resolvePackage");

module.exports = async function resolveReadme({ packageName }) {
  const package = await resolvePackage({ packageName });

  return path.resolve(package, "README.md");
};
