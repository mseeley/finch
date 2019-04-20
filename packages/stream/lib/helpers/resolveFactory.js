const identity = ({ value }) => Promise.resolve(value);

module.exports = function resolveFactoryFor(stage) {
  const { off, use } = stage;

  return off
    ? // When off a stage acts acts as an identity function.
      identity
    : // Be aware that `use` values representing relative file paths are
      // resolved relative to this file.
      require(use);
};
