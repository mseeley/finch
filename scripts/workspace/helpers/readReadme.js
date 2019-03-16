const fs = require("fs-extra");
const resolveReadme = require("./resolveReadme");

module.exports = async function readPackageJson({ packageName }) {
  const file = await resolveReadme({ packageName });

  return fs.readFile(file, { encoding: "utf8" });
};
