const path = require("path");
const yaml = require("js-yaml");
const localNameOf = require("../localNameOf");
const readFile = require("./readFile");

const localName = `[${localNameOf(__filename)}]`;

const yamlOptions = { json: true, schema: yaml.JSON_SCHEMA };

const parsers = {
  ".json": contents => JSON.parse(contents),
  ".yml": contents => yaml.safeLoad(contents, yamlOptions),
  ".yaml": contents => yaml.safeLoad(contents, yamlOptions),
};

module.exports = async function readJSON(options) {
  const extname = path.extname(options.filename).toLowerCase();
  const parse = parsers[extname];

  if (!parse) {
    throw new Error(
      `${localName} Unrecognized format ${options.filename}: ${extname}`
    );
  }

  try {
    let contents = await readFile({ filename: options.filename });

    contents = contents.trim();

    // The parser is expected to throw on invalid input.
    return (contents && parse(contents)) || null;
  } catch (error) {
    throw new Error(
      `${localName} Parse error ${options.filename}: ${error.message}`
    );
  }
};
