const path = require("path");
const fs = require("fs-extra");
const tmp = require("tmp");

exports.stabilityThreshold = 500;
exports.superGenerousStabilityThreshold = exports.stabilityThreshold * 6;

exports.copyToUniqueTmpDir = async pathnames => {
  if (!Array.isArray(pathnames)) {
    throw new Error("`copyToUniqueTmpDir` requires an pathnames String[]");
  }

  const dirname = tmp.dirSync().name;
  const destinations = [];

  for (const pathname of pathnames) {
    const destination = path.resolve(dirname, path.basename(pathname));

    destinations.push(destination);

    await fs.copyFile(pathname, destination);
  }

  // CAUTION. The `wait` below works around a racey behavior in chokidar/macOS'
  // filesystem watching and file creation.
  await exports.wait(exports.superGenerousStabilityThreshold);

  return destinations;
};

exports.once = fn => {
  let hasExecuted = false;

  return async (...args) => {
    if (!hasExecuted) {
      hasExecuted = true;
      await fn(...args);
    }
  };
};

exports.touch = async filename => {
  const encoding = "utf8";

  await fs.writeFile(filename, await fs.readFile(filename, encoding), encoding);
};

exports.wait = async (milliseconds = exports.stabilityThreshold * 1.5) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};
