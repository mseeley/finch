module.exports = {
  "*.js": ["yarn lint:js --", "git add"],
  "*.{html|md}": ["yarn prettier --write --", "git add"]
};
