module.exports = args => {
  // Assume that params is an object.
  args.params.evil = true;
  args.params.villian = { level: 99 };

  return Promise.resolve(args);
};
