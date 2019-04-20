// The return value of this function is provided by operators when they've
// completed their operations successfully yet have nothing to project. Streams
// clone the value object which requires a non-reference type value must be
// returned.
const secret =
  "op8o2MoSpgSxMRikPFdjixbAFz2ucZ5LtvuLU2bTzoCguX53dxfbAnpKfiv3uziu";

module.exports = () => secret;

if (process.env.NODE_ENV === "test") {
  module.exports.__secret__ = secret;
}
