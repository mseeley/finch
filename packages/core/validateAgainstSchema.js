const Ajv = require("ajv");
const operator = require("./schemas/operator.json");
const stream = require("./schemas/stream.json");

const KEYWORD_ADDITIONAL_PROPERTIES = "additionalProperties";
const KEYWORD_IF = "if";
const KEYWORD_ELSE = "else";
const KEYWORD_BLACKLIST = [KEYWORD_IF, KEYWORD_ELSE];

let ajv;

function consolidateErrors(errors) {
  return errors
    .filter((error) => !KEYWORD_BLACKLIST.includes(error.keyword))
    .map((error) =>
      error.keyword === KEYWORD_ADDITIONAL_PROPERTIES
        ? {
            ...error,
            message: `${error.message}: ${error.params.additionalProperty}`,
          }
        : error
    )
    .reduce((acc, error) => {
      let errorAtPointer = acc.find((e) => e.pointer === error.dataPath);

      if (!errorAtPointer) {
        errorAtPointer = {
          pointer: error.dataPath,
          errors: [],
        };

        acc.push(errorAtPointer);
      }

      if (!errorAtPointer.errors.includes(error.message)) {
        errorAtPointer.errors.push(error.message);
      }

      return acc;
    }, []);
}

module.exports = function validateAgainstSchema(schemaId, subject) {
  if (!ajv) {
    ajv = new Ajv({
      allErrors: true,
      jsonPointers: true,
      schemas: [operator, stream],
    });
  }

  const validate = ajv.getSchema(schemaId);

  return validate(subject) ? null : consolidateErrors(validate.errors);
};
