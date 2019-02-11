const fs = require("fs-extra");
const resolvePackageJson = require("./resolvePackageJson");

module.exports = async function writePackageJson({ packageName, json }) {
  const file = await resolvePackageJson({ packageName });

  return fs.writeJSON(file, json, { spaces: 2 });
};
