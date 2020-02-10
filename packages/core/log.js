const isNodeEnvTest = process.env.NODE_ENV === "test";

function log(...args) {
  !isNodeEnvTest && console.log(...args);
}

log.error = (...args) => {
  !isNodeEnvTest && console.error(...args);
};

log.warn = (...args) => {
  !isNodeEnvTest && console.warn(...args);
};

module.exports = log;
