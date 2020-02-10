const assert = require("assert");
const path = require("path");
const localNameOf = require("../localNameOf");

const localName = `[${localNameOf(__filename)}]`;

module.exports = async function readFile(options, ioc = {}) {
  assert(
    path.isAbsolute(options.filename),
    `${localName} An absolute path is required: ${options.filename}`
  );

  const fs =
    (process.env.NODE_ENV === "test" && ioc["fs-extra"]) || require("fs-extra");

  try {
    await fs.access(options.filename, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`${localName} Missing or unreadable: ${options.filename}`);
  }

  const stat = await fs.stat(options.filename);

  if (!stat.isFile()) {
    throw new Error(`${localName} Not a file: ${options.filename}`);
  }

  try {
    // File contents are returned as is, no trimming.
    return await fs.readFile(options.filename, { encoding: "utf8" });
  } catch (error) {
    throw new Error(`${localName} Read error: ${error.message}`);
  }
};
