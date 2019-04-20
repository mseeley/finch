const empty = require("../../../empty");

module.exports = ({ value }) => Promise.resolve(value % 2 ? empty() : value);
