function callback(value) {
  return new Promise(resolve => {
    resolve(value);
  });
}

module.exports = async ({ value, params }) => {
  return await callback(value);
};
