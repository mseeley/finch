const parse = require("parse-package-name");

module.exports = async function({ packageName }) {
  const parsed = parse(packageName);
  const parts = parsed.name.split(/\//);

  let scope;
  let package;

  if (parts.length === 1) {
    package = parts[0];
  } else if (parts.length === 2) {
    scope = parts[0];
    package = parts[1];
  }

  return {
    ...parsed,
    scope,
    package,
  };
};
