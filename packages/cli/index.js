#!/usr/bin/env node

const path = require("path");
const { localNameOf } = require("@finch/core");
const json = require("./package.json");

const localName = `[${localNameOf(__filename)}]`;

function execute(dependency) {
  return async argv => {
    try {
      const { debug, stabilityThreshold, ...options } = argv;
      const fields = {
        FINCH_DEBUG: debug,
        FINCH_STABILITY_THRESHOLD: stabilityThreshold,
      };

      for (const key in fields) {
        if (debug) {
          console.log(localName, `Setting process.env.${key}=${fields[key]}`);
        }

        // Assigning a property on process.env will implicitly convert the value
        // to a string. Mutating process.env differently between multiple Finch
        // processes will cause environment pollution between processes.
        process.env[key] = fields[key];
      }

      await require(dependency)(options);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };
}

require("yargs")
  .scriptName(json.name)
  .version(json.version)
  .usage("$0 <cmd> [options]")
  .env("FINCH_")
  .alias({ h: "help", v: "version" })
  .option({
    debug: {
      default: process.env.FINCH_DEBUG
        ? Boolean(process.env.FINCH_DEBUG)
        : false,
      describe: "Log additional information. Overrides FINCH_DEBUG.",
      type: "boolean",
    },
    stabilityThreshold: {
      default: process.env.FINCH_STABILITY_THRESHOLD
        ? Number(process.env.FINCH_STABILITY_THRESHOLD)
        : 2000,
      describe:
        "Millisecond duration a file size must remain static before Finch responds to file changes. The appropriate value is heavily dependent on OS and hardware. Overrides FINCH_STABILITY_THRESHOLD.",
      type: "number",
    },
  })
  .command(
    "start [pathname]",
    "Start Finch streams found at <pathname>.",
    yargs => {
      yargs
        .positional("pathname", {
          coerce: path.resolve,
          default: ".",
          describe: "The stream file or directory of stream files.",
          normalize: true,
          type: "string",
        })
        .option({
          continue: {
            describe: "Keep stream resident after stream error(s).",
            type: "boolean",
          },
        })
        .option({
          watch: {
            default: false,
            describe: "Should Finch restart streams on file changes.",
            type: "boolean",
          },
        });
    },
    execute("./start")
  )
  .strict()
  .help().argv;
