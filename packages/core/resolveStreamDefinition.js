const assert = require("assert");
const path = require("path");
const readJSON = require("./helpers/readJSON");
const localNameOf = require("./localNameOf");
const validateAgainstSchema = require("./validateAgainstSchema");

const localName = `[${localNameOf(__filename)}]`;

// A relative path must always begin with one or more dots followed by a forward
// slash. Any non-absolute path without the prefix is resolved as a node module.
const isRelativePath = /^\.+\//;

async function reduceOperators(options) {
  const acc = { definitions: [], dependencies: new Set() };

  for (const definition of options.definitions) {
    // Errors thrown by `reduceOperator()` should be handled by callers.
    const { definitions, dependencies } = await reduceOperator({
      continueOnError: options.continueOnError,
      definition,
      resolveFrom: options.resolveFrom,
    });
    acc.definitions.push(...definitions);
    acc.dependencies = new Set([...acc.dependencies, ...dependencies]);
  }

  return acc;
}

async function reduceOperator(options) {
  // First, validate the definition.
  const validationErrors = validateAgainstSchema(
    "operator.json",
    options.definition
  );

  if (validationErrors) {
    const errors = validationErrors[0];

    throw new Error(
      `${localName}: ${JSON.stringify(
        options.definition
      )} is invalid: ${JSON.stringify(errors)}`
    );
  }

  // Then, resolve the module which backs the definition.
  assert(
    options.resolveFrom === undefined || path.isAbsolute(options.resolveFrom),
    `${localName} \`resolveFrom\` must be undefined or an absolute path`
  );

  const resolveOptions = options.resolveFrom
    ? { paths: [options.resolveFrom] }
    : undefined;
  const { include, use } = options.definition;
  const module = include || use;

  let resolvedModule;

  try {
    resolvedModule = require.resolve(module, resolveOptions);
  } catch (error) {
    let message = `${localName}: ${JSON.stringify(
      options.definition
    )} is invalid: cannot find ${module}`;

    if (options.resolveFrom) {
      message += ` from ${options.resolveFrom}`;
    }

    throw new Error(message);
  }

  // Then, build a flat list of one or more definitions coupled to their
  // recursive dependencies. Any `off` operator definitions are ignored.
  const acc = { definitions: [], dependencies: new Set() };

  if (include) {
    let nextDefinitions;

    // Allow errors thrown by `readJSON` to bubble.
    nextDefinitions = await readJSON({ filename: resolvedModule });

    nextDefinitions = Array.isArray(nextDefinitions)
      ? nextDefinitions
      : [nextDefinitions];

    // Allow errors thrown by recursive calls to `reduceOperator` to bubble.
    const nextAcc = await reduceOperators({
      continueOnError: options.continueOnError,
      definitions: nextDefinitions,
      resolveFrom: path.dirname(resolvedModule),
    });

    acc.definitions.push(...nextAcc.definitions);
    acc.dependencies = new Set([
      ...acc.dependencies,
      resolvedModule,
      ...nextAcc.dependencies,
    ]);
  } else if (use) {
    const definition = { ...options.definition };

    if (path.isAbsolute(module) || isRelativePath.test(module)) {
      acc.dependencies.add(resolvedModule);
      definition.use = resolvedModule;
    }

    if (
      typeof definition.continueOnError !== "boolean" &&
      typeof options.continueOnError === "boolean"
    ) {
      definition.continueOnError = options.continueOnError;
    }

    acc.definitions.push(definition);
  }

  return acc;
}

module.exports = async function resolveStreamDefinition(options) {
  const { definitions, dependencies } = await reduceOperators(options);

  return {
    definitions,
    // An array of dependencies is easier for iteration and JSON serialization.
    dependencies: Array.from(dependencies),
  };
};
