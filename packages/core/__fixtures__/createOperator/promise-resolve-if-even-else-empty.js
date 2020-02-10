const EMPTY = require("../../EMPTY");

module.exports = ({ value }) => Promise.resolve(value % 2 ? EMPTY() : value);
