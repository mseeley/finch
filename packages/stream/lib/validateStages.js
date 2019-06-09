const Ajv = require("ajv");
const schema = require("./schemas/stages.json");

const KEYWORD_ADDITIONAL_PROPERTIES = "additionalProperties";
const KEYWORD_IF = "if";
const KEYWORD_ELSE = "else";
const KEYWORD_BLACKLIST = [KEYWORD_IF, KEYWORD_ELSE];

function reduceErrors(errors) {
  return errors
    .filter(error => !KEYWORD_BLACKLIST.includes(error.keyword))
    .map(error =>
      error.keyword === KEYWORD_ADDITIONAL_PROPERTIES
        ? {
            ...error,
            message: `${error.message}: ${error.params.additionalProperty}`,
          }
        : error
    )
    .reduce((acc, error) => {
      let errorAtPointer = acc.find(e => e.pointer === error.dataPath);

      if (!errorAtPointer) {
        errorAtPointer = {
          pointer: error.dataPath,
          errors: [],
        };

        acc.push(errorAtPointer);
      }

      errorAtPointer.errors.push(error.message);

      return acc;
    }, []);
}

let validator;

module.exports = function validateStages(stages) {
  if (!validator) {
    const ajv = new Ajv({ allErrors: true, jsonPointers: true });

    validator = ajv.compile(schema);
  }

  return validator(stages) ? null : reduceErrors(validator.errors);
};
