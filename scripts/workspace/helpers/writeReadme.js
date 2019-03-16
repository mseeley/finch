const fs = require("fs-extra");
const resolveReadme = require("./resolveReadme");

module.exports = async function writeReadme({ packageName, data }) {
  const file = await resolveReadme({ packageName });

  return fs.writeFile(file, data, { encoding: "utf8" });
};
