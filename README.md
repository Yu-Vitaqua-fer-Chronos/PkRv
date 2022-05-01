# Revite TS Plugin Boilerplate

Build [Revite](https://github.com/revoltchat/revite) v1 plugin manifests using Typescript.

> ⚠️ **Warning:** Revite's plugin API is highly experimental and your plugins will probably break in the future. You have been warned.

## Getting started

Clone this repository.
```sh
git clone https://github.com/janderedev/revite-ts-plugin-boilerplate myprojectname
cd myprojectname
yarn # or "npm install"
```

Change `version`, `id` and `namespace` in manifest.json according to the [Plugin API Documentation](https://developers.revolt.chat/plugin-api).
The plugin code lives in `src/`. Since TypeScript has it's limitations when compiling to a single file, you can't use imports here - everything you do is global and accessible from other files.

To build your plugin, run `yarn build` (or `npm run build`). This will create `target/plugin.json`. You can now load this manifest in Revite from the Dev tools:

```js
state.plugins.add({ "format": 1, "version": ... });
```
