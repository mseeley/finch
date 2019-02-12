module.exports = {
  "*.js": ["yarn eslint --fix", "git add"],
  "*.{html|md}": ["yarn prettier --write", "git add"]
};
