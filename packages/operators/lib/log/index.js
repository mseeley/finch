module.exports = async ({ value, params }) => {
  if ("message" in params) {
    // eslint-disable-next-line no-console
    console.log(params.message, value);
  } else {
    // eslint-disable-next-line no-console
    console.log(value);
  }

  return value;
};
