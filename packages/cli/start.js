const { createStreamFromPath, localNameOf } = require("@finch/core");
const emoji = require("node-emoji");

const localName = `[${localNameOf(__filename)}]`;

module.exports = async function start(argv) {
  const { pathname, watch } = argv;
  const options = { pathname, shouldWatch: watch };

  if (argv.continue != null) {
    // `continue` has no default value. Its default behavior is determined at
    // runtime by `createStreamFromPath()`.
    options.continueOnError = argv.continue;
  }

  createStreamFromPath(options).subscribe(
    value => console.log(localName, value),
    error => console.log(localName, emoji.get("x"), error),
    () => console.log(localName, emoji.get("bird"), "Done")
  );
};
