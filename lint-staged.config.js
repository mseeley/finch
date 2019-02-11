module.exports = {
  "*.js": ["yarn lint:js --fix", "git add"],
  "*.{html|md}": ["yarn prettier --write", "git add"]
};
