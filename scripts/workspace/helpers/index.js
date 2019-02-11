const path = require("path");
const fs = require("fs-extra");

const files = fs.readdirSync(__dirname);

files.forEach(file => {
  const extension = path.extname(file);
  const basename = path.basename(file, extension);

  if (
    extension === ".js" &&
    path.basename(__filename, extension) !== basename
  ) {
    exports[basename] = require(`./${basename}`);
  }
});
