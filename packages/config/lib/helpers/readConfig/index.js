const fs = require("fs-extra");
const yaml = require("js-yaml");
const isPlainObject = require("is-plain-object");

function formatOf(filename) {
  const matches = filename.match(/\.(\w+)$/);

  return matches && matches[1].toLowerCase();
}

const parsers = {
  json: contents => JSON.parse(contents),
  yml: contents => yaml.safeLoad(contents, { json: true }),
  yaml: contents => yaml.safeLoad(contents, { json: true })
};

/**
 * readFile is a helper responsible for reading and parsing configuration files.
 * It purposefully tolerates empty and missing files while never tolerating
 * malformed files. Currently a file is only malformed when its syntax was not
 * accepted by a parser. Files are read asynchronously by default. Although a
 * synchronous mode is available.
 *
 * Edge cases where this helper _will throw_ when...
 * - file has an unsupported extension. Only `.json`, `.yml`, and `.yaml`
 *   are supported.
 * - file is malformed.
 * - a file-system read error was experienced.
 *
 * Edge cases where this helper _will not throw_ when...
 *   - file is missing.
 *   - file is empty.
 *   - file is valid syntax but contains no configuration.
 *
 * The forgiving handling of empty and missing files works under the
 * assumption that the file will have configuration later. In these cases a
 * `null` value represents "no configuration".
 *
 * @param  {object} parameters
 * @param  {string} parameters.filename The resolved path to the configuration
 * file.
 * @param  {boolean} [parameters.sync] Default false. When true the file is
 * read synchronously.
 *
 * @return {object} result
 * @return {object} result.config  The configuration as a JavaScript object.
 * @return {string} result.filename The filename of the configuration.
 */
module.exports = async function({ filename, sync = false }) {
  const format = formatOf(filename);

  if (!parsers[format]) {
    throw new Error(`${filename} is an unsupported format`);
  }

  let contents;

  if (sync) {
    contents =
      fs.existsSync(filename) &&
      fs.readFileSync(filename, { encoding: "utf8" });
  } else {
    contents =
      (await fs.exists(filename)) &&
      (await fs.readFile(filename, { encoding: "utf8" }));
  }

  contents = contents ? contents.trim() : "";

  // The parser is expected to throw on malformed syntax.
  const data = contents ? parsers[format](contents) : {};

  if (!isPlainObject(data)) {
    // Enforce that the parsed output must be a plain object for consistent
    // behavior between JSON and YAML. For example, the YAML parser will return
    // the plain file contents when there isn't an object structure.
    throw new Error(`${filename} syntax is invalid`);
  }

  return {
    data: Object.keys(data).length ? data : null,
    filename
  };
};
