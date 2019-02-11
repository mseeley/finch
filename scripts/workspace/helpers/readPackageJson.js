const fs = require("fs-extra");
const resolvePackageJson = require("./resolvePackageJson");

module.exports = async function readPackageJson({ packageName }) {
  const file = await resolvePackageJson({ packageName });

  return fs.readJSON(file);
};
