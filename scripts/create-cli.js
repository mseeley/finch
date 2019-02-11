#!/usr/bin/env node

const inquirer = require("inquirer");
const create = require("./workspace/create");
const questions = require("./workspace/questions");

async function main() {
  try {
    const settings = await inquirer.prompt([
      questions.packageNameToOrgScopeNotExists,
      questions.isPrivate
    ]);

    await create(settings);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
}

main();
