const toOrgScope = require("./toOrgScope");

module.exports = async function getOrgScopeAll() {
  return await toOrgScope({ packageName: "*" });
};
