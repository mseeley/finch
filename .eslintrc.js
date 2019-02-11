// Allow our specific configuration file to populate the standard eslint config.
// This enables consistent `{tool}.config.js` file naming without any custom
// configuration in editors or eslint CLI invocations.
module.exports = require("./eslint.config.js");
