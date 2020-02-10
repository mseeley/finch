:books: All [guides](/README.md#guides) and [package documentation](/README.md#package-documentation).

---

# Workspace Guide <!-- omit in toc -->

- [Helpful reading](#helpful-reading)
- [Workspaces root](#workspaces-root)
- [Package workspaces](#package-workspaces)

This document explains general package workspace handling.

## Helpful reading

If you're unfamiliar with monorepos, Lerna, and/or Yarn Workspaces please read through the links below:

- [A Beginnner's Guide to Lerna with Yarn Workspaces](https://medium.com/@jsilvax/a-workflow-guide-for-lerna-with-yarn-workspaces-60f97481149d)

## Workspaces root

Install all package workspace dependencies from the project root:

```
yarn
```

Add a development dependency to the workspace root:

```
yarn add {dependency} --dev -W
```

> :bird: Non-development dependencies should not be installed at the root.

Remove a dependency from the workspace root:

```
yarn remove {dependency} -W
```

Create a new package workspace:

```
# Create the new package workspace interactively
yarn new
# Update workspaces root node_modules
yarn
```

> :bird: Scaffolding is updated and copied to the `/packages/{workspace}` directory. The scaffolding is located in `/scripts/workspace/template/`.

Destroy a package workspace.

```
# Remove the package globally
yarn all remove @finch/{workspace}
# Delete the workspace directory
rm -rf packages/{workspace}
# Update workspaces root node_modules
yarn
```

Add a dependency to all package workspaces:

```
yarn all add {dependency}
```

> :bird: Always include the dependency's version when adding a dependency to a local workspace. The `#.#.#` version must be equivalent to the `version` in `packages/package-b/package.json`. If the version is omitted then Yarn will install the latest version of the package from NPM.

Remove a dependency from all package workspaces:

```
yarn all remove {dependency}
```

## Package workspaces

Add a dependency between two local package workspaces:

```
cd packages/{workspace}
yarn add @finch/{other-workspace}@#.#.#
```

> :bird: Remember, always include the dependency's version when adding a dependency to a local workspace.

Add a published dependency to a package workspace:

```
cd packages/{workspace}
yarn add {dependency}
```

---

:bird:
