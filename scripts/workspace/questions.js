const validateNpmPackageName = require("validate-npm-package-name");
const {
  hasOrgScope,
  findPackagesInScope,
  getOrgScopeAll,
  toOrgScope
} = require("./helpers");

// Factories

function question(name, options) {
  const inherited = options.extends ? { ...exports[options.extends] } : {};
  const parameters = { ...inherited, ...options };

  delete parameters.extends;

  if (!parameters.name) {
    parameters.name = name;
  }

  if (Array.isArray(parameters.filter)) {
    parameters.filter = filter(...parameters.filter);
  }

  if (Array.isArray(parameters.validate)) {
    parameters.validate = validate(...parameters.validate);
  }

  exports[name] = parameters;
}

function filter(...filters) {
  return async function(initialValue) {
    let filteredValue = initialValue;
    for (let i = 0; i < filters.length; i++) {
      filteredValue = await filters[i](filteredValue);
    }
    return filteredValue;
  };
}

function validate(...validations) {
  return async function(value, answers) {
    let result = false;

    for (let i = 0; i < validations.length; i++) {
      result = await validations[i](value, answers);

      if (!result || typeof result === "string") {
        break;
      }
    }

    return result;
  };
}

// Filtering

async function filterSanitizeString(value) {
  const sanitized = value.trim();

  return sanitized;
}

async function filterTryToOrgScope(value) {
  return (await hasOrgScope({ packageName: value }))
    ? value
    : await toOrgScope({ packageName: value });
}

// Validations
// - String validations assume the value has already been trimmed.

async function validateLernaScope(value, answers) {
  const orgScope = await getOrgScopeAll();

  if (orgScope === value) {
    // A value equal to orgScope must be accompanied by at least one other org
    // package.
    const packages = await findPackagesInScope();

    return packages.length > 0 || "No other packages exist";
  }

  // The Lerna scope should never equal another package name. For example we'd
  // never (un)link or (un)install dependencies from a module to itself.
  return value === answers.packageName
    ? "Invalid scope"
    : await validatePackageExists(value);
}

async function validatePackageName(value, answers) {
  const isValid = validateNpmPackageName(value);

  return isValid.validForNewPackages || "Invalid package name";
}

async function validatePackageExists(value, answers) {
  const packages = await findPackagesInScope();

  return packages.includes(value) || `${value} does not exist`;
}

async function validatePackageNotExists(value, answers) {
  const packages = await findPackagesInScope();

  return !packages.includes(value) || `${value} already exists`;
}

async function validateString(value, answers) {
  const isValid = Boolean(value);

  return isValid || "Please enter a non-empty string";
}

// Input

question("packageName", {
  type: "input",
  message: "Package:",
  filter: [filterSanitizeString],
  validate: [validateString, validatePackageName]
});

question("packageNameToOrgScope", {
  extends: "packageName",
  filter: [filterSanitizeString, filterTryToOrgScope]
});

question("packageNameToOrgScopeExists", {
  extends: "packageNameToOrgScope",
  validate: [validateString, validatePackageName, validatePackageExists]
});

question("packageNameToOrgScopeNotExists", {
  extends: "packageNameToOrgScope",
  validate: [validateString, validatePackageName, validatePackageNotExists]
});

question("packageDescription", {
  type: "input",
  message: "Description:",
  filter: [filterSanitizeString],
  validate: [validateString]
});

question("lernaScopeExists", {
  extends: "packageNameToOrgScopeExists",
  name: "scope",
  message: `Scope:`,
  default: getOrgScopeAll,
  validate: [validateString, validateLernaScope]
});

question("confirmPackageName", {
  name: "isConfirmed",
  message: "Re-enter package to continue",
  filter: [filterSanitizeString],
  validate: [
    validateString,
    async (value, answers) => value === answers.packageName
  ]
});

// Confirm

question("isPrivate", {
  type: "confirm",
  message: "Private package?",
  default: false
});
