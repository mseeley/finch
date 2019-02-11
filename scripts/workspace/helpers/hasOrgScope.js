const getOrgScope = require("./getOrgScope");

module.exports = async function hasOrgScope({ packageName }) {
  const scope = await getOrgScope();
  const startsWithScope = new RegExp(`^${scope}`);

  return startsWithScope.test(packageName);
};
