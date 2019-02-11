const getOrgScope = require("./getOrgScope");
const hasOrgScope = require("./hasOrgScope");

module.exports = async function toOrgScope({ packageName }) {
  return (await hasOrgScope({ packageName }))
    ? packageName
    : `${await getOrgScope()}/${packageName}`;
};
