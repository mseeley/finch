const tasks = (...arr) => arr.join(" && ");

// This file is consumed by Husky by way of .huskyrc.js.
module.exports = {
  hooks: {
    "commit-msg": tasks("commitlint -E HUSKY_GIT_PARAMS"),
    "pre-commit": tasks("lint-staged", "yarn test --ci"),
  },
};
