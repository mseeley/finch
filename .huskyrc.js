// Allow our specific configuration file to populate the standard Husky config.
// This enables consistent `{tool}.config.js` file naming without any custom
// configuration in editors or Husky CLI invocations.
module.exports = require("./husky.config.js");
