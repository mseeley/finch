# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.8](https://github.com/mseeley/finch/compare/v1.0.7...v1.0.8) (2020-03-01)


### Bug Fixes

* **core:** properly avoid ignored operators ([395c5f3](https://github.com/mseeley/finch/commit/395c5f3)), closes [#251](https://github.com/mseeley/finch/issues/251)





## [1.0.7](https://github.com/mseeley/finch/compare/v1.0.6...v1.0.7) (2020-03-01)


### Bug Fixes

* **core:** update package.json description ([37dc42c](https://github.com/mseeley/finch/commit/37dc42c))
* **json-stringify:** update package.json description ([4c0e63b](https://github.com/mseeley/finch/commit/4c0e63b))
* **regexp-accept:** update package.json description ([df8e879](https://github.com/mseeley/finch/commit/df8e879))
* **regexp-ignore:** update package.json description ([9990547](https://github.com/mseeley/finch/commit/9990547))
* **regexp-replace:** update package.json description ([0eaab2a](https://github.com/mseeley/finch/commit/0eaab2a))
* **regexp-split:** update package.json description ([b6e413b](https://github.com/mseeley/finch/commit/b6e413b))
* **values:** update package.json description ([738b508](https://github.com/mseeley/finch/commit/738b508))





## [1.0.6](https://github.com/mseeley/finch/compare/v1.0.5...v1.0.6) (2020-03-01)


### Bug Fixes

* **cli:** does not publish unit tests nor fixtures ([ae0069d](https://github.com/mseeley/finch/commit/ae0069d))
* **core:** does not publish unit tests nor fixtures ([6e41f97](https://github.com/mseeley/finch/commit/6e41f97))
* **json-stringify:** does not publish unit tests nor fixtures ([f71704a](https://github.com/mseeley/finch/commit/f71704a))
* **regexp-accept:** does not publish unit tests nor fixtures ([326e39c](https://github.com/mseeley/finch/commit/326e39c))
* **regexp-ignore:** does not publish unit tests nor fixtures ([54d47c2](https://github.com/mseeley/finch/commit/54d47c2))
* **regexp-replace:** does not publish unit tests nor fixtures ([f8dc5c7](https://github.com/mseeley/finch/commit/f8dc5c7))
* **regexp-split:** does not publish unit tests nor fixtures ([dda7ddb](https://github.com/mseeley/finch/commit/dda7ddb))
* **values:** does not publish unit tests nor fixtures ([1e9737c](https://github.com/mseeley/finch/commit/1e9737c))





## [1.0.5](https://github.com/mseeley/finch/compare/v1.0.4...v1.0.5) (2020-03-01)


### Bug Fixes

* **core:** localNameOf correctly handles scoped module filenames ([9927971](https://github.com/mseeley/finch/commit/9927971)), closes [#250](https://github.com/mseeley/finch/issues/250)





## [1.0.4](https://github.com/mseeley/finch/compare/v1.0.3...v1.0.4) (2020-03-01)


### Bug Fixes

* **cli:** require local package.json ([e11517b](https://github.com/mseeley/finch/commit/e11517b))





## [1.0.3](https://github.com/mseeley/finch/compare/v1.0.2...v1.0.3) (2020-03-01)


### Bug Fixes

* **core:** core dependency incorrect tracked as dev dep ([3c0b6e4](https://github.com/mseeley/finch/commit/3c0b6e4))





## [1.0.2](https://github.com/mseeley/finch/compare/v1.0.1...v1.0.2) (2020-03-01)

**Note:** Version bump only for package finch





## [1.0.1](https://github.com/mseeley/finch/compare/v1.0.0...v1.0.1) (2020-03-01)

**Note:** Version bump only for package finch





# 1.0.0 (2020-03-01)


### Bug Fixes

* **config:** @finch/config handles async watcher closing ([3463f54](https://github.com/mseeley/finch/commit/3463f54))
* **logger:** prefix log statements using localNameOf ([b3984b5](https://github.com/mseeley/finch/commit/b3984b5))
* **operators:** regexp-blacklist without default params ([bf819d0](https://github.com/mseeley/finch/commit/bf819d0))
* **operators:** regexp-whitelist without default params ([9d1e821](https://github.com/mseeley/finch/commit/9d1e821))
* **stream:** rename validateStream to validateStages ([bc5134d](https://github.com/mseeley/finch/commit/bc5134d))


### Features

* **config:** @finch/config observable configuration streams ([4a06882](https://github.com/mseeley/finch/commit/4a06882))
* **core:** @finch/core consolidates shared business logic ([6df8e9d](https://github.com/mseeley/finch/commit/6df8e9d))
* **core:** complete finch core package ([cf35006](https://github.com/mseeley/finch/commit/cf35006))
* **core-tools:** consolidates package development tooling ([ad285d8](https://github.com/mseeley/finch/commit/ad285d8))
* **emitters:** add fixture emitter ([ccaea5c](https://github.com/mseeley/finch/commit/ccaea5c))
* **logger:** @finch/logger a simple package-aware default logger ([948b7e8](https://github.com/mseeley/finch/commit/948b7e8))
* **operators:** add log ([e1f93c6](https://github.com/mseeley/finch/commit/e1f93c6))
* **operators:** add regexp-blacklist and regexp-whitelist ([83cb3f9](https://github.com/mseeley/finch/commit/83cb3f9))
* **operators:** add string-replace ([72bfd37](https://github.com/mseeley/finch/commit/72bfd37))
* **stream:** add stream ([d120a98](https://github.com/mseeley/finch/commit/d120a98))
* **stream:** operators share stream-level immutable context ([030d5e5](https://github.com/mseeley/finch/commit/030d5e5))
