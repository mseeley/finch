const path = require("path");
const fs = require("fs-extra");
const {
  readPackageJson,
  readReadme,
  resolvePackage,
  writePackageJson,
  writeReadme
} = require("./helpers");

async function copyTemplate({ packageName }) {
  const template = path.resolve(__dirname, "template");
  const package = await resolvePackage({ packageName });

  if (await fs.pathExists(package)) {
    throw new Error(`"${package}" already exists`);
  }

  await fs.copy(template, package);

  // These files should not exist in the template. Although if they do they
  // shouldn't escape.
  await fs.remove(path.resolve(package, "node_modules"));
}

async function updatePackageJson({
  isPrivate,
  packageDescription,
  packageName
}) {
  const json = await readPackageJson({ packageName });

  json.name = packageName;
  json.description = packageDescription;
  json.private = isPrivate;

  await writePackageJson({ packageName, json });
}

async function updateReadme({ isPrivate, packageDescription, packageName }) {
  const tokens = { packageDescription, isPrivate, packageName };

  const data = Object.entries(tokens).reduce(
    (acc, [token, value]) => acc.replace(`{${token}}`, value),
    await readReadme({ packageName })
  );

  await writeReadme({ packageName, data });
}

module.exports = async settings => {
  await copyTemplate(settings);
  await updatePackageJson(settings);
  await updateReadme(settings);
};
