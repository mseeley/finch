## @finch/emitters/irc-messages

Thje

### Setup

See `inspircd.conf` for an overview of development server configuration.

#### macOS

- Use Brew to install OpenSSL.
- Run `./setup`.
  - This script attempts to workaround trouble detecting libssl. Review other
    alternatives in https://github.com/varnish/hitch/issues/246 if the workaround
    fails for you.
- Before running `./setup` again you'll want to run `./clean` to remove a
  previous installation.

#### Window

Help wanted.

#### Linux

Help wanted.

### Development

- `./configure`: Copies configuration from `inspircd.conf` to the correct
  location. Server must be restarted after configuration changes.
- `./start`: Starts the IRC server.
- `yarn ircd-stop`: Stops the IRC server.

## JavaScript

### Setup

Setup instructions are consistent per platform.

- [Install `nvm`](https://github.com/creationix/nvm).
- [Install `yarn`](https://yarnpkg.com/lang/en/docs/install/). This document
  assumes you choose a global installation.
- Run `yarn` in the root of the repository. Hang tight while all JS dependencies
  are installed.

### Development

Setup instructions are consistent per platform.

Use `nvm use` to switch to the required NodeJS version, defined in `.nvmrc`.
Follow on-screen instructions if the required version is not installed.

- `yarn dev`: Run the main entry point and re-run as modified files are changed.
- `yarn devi`: Runs `yarn dev` and opens the debugger.
- `yarn lint`: Run eslint on all JavaScript files.
- `yarn test`: Run Jest against every `*.test.js` file. Tip, use
  `yarn test --watch` to watch and re-run tests as changes are saved.
