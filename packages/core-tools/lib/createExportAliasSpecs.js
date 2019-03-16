/* eslint-env jest */

const path = require("path");
const fs = require("fs");

module.exports = function createExportAliasSpecs({ exportDirectory }) {
  const aliases = fs
    .readdirSync(exportDirectory)
    .filter(filename => !/^\./.test(filename))
    .filter(filename => /\.js$/.test(filename))
    .filter(filename => !/spec\.js$/.test(filename))
    .map(filename => filename.replace(/\.js$/, ""));

  const lib = path.resolve(exportDirectory, "lib");

  const modules = fs
    .readdirSync(lib)
    .filter(filename => !/^\./.test(filename))
    .reduce((acc, filename) => {
      const pathname = path.resolve(lib, filename);

      if (fs.statSync(pathname).isDirectory()) {
        acc.push(pathname);
      }

      return acc;
    }, []);

  // All aliases should have a module.
  test.each(aliases)("alias %s has module", moduleName => {
    const alias = require(path.join(exportDirectory, moduleName));
    const actual = require(path.join(lib, moduleName));
    // const actual = require(`./lib/${moduleName}/`);

    expect(alias).toBe(actual);
  });

  // All modules should have an alias.
  test.each(modules)("module %s has alias", file => {
    const moduleName = file.split(path.sep).pop();
    const alias = require(path.join(exportDirectory, moduleName));
    const actual = require(file);

    expect(alias).toBe(actual);
  });
};
