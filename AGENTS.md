# Repository guide

## Project structure

This repository is a minimal TypeScript example rather than a multi-component application.

- `src/index.ts` is the only maintained runtime source and the only application entry point.
- `dist/` contains ignored build output. Do not edit or commit it.
- `package.json` defines dependency versions, build commands, lint commands, and the published entry point (`dist/index.js`). No lockfile is committed; `package-lock.json` is ignored.
- `README.md` documents the setup as a step-by-step TypeScript, webpack, and ESLint tutorial.
- `.vscode/settings.json` only customizes the editor window title.

## Runtime and data flow

`src/index.ts` declares `ProjectName`, passes it into the `say()` template string through lexical scope, and writes the returned message to standard output with `console.log`. There are no external inputs, APIs, persistent stores, browser components, or asynchronous operations.

The repository has no `start` script. Build the TypeScript entry point with `npm run build:ts`, then run `node dist/index.js` when you need to exercise the compiled program. The package-level `main` field also resolves consumers to that compiled file.

## Configuration

- `tsconfig.json` supplies strict type-checking and modern module/output settings to tools that load the project configuration. The explicit-file `build:ts` and `watch` commands invoke `tsc src/index.ts`, so TypeScript does not apply the project file in the same way as a plain `tsc` invocation.
- `webpack.config.js` selects production mode, loads `.ts` and `.tsx` files through `ts-loader`, resolves those extensions, and emits `dist/bundle.js`.
- `eslint.config.cjs` applies the TypeScript ESLint recommended rules and Prettier checks to TypeScript files. It permits console output and ignores generated and dependency directories.
- `.gitignore` excludes dependencies, `dist/`, logs, caches, and local editor artifacts.

## Build and validation workflow

Use the scripts from the repository root:

```bash
npm run lint
npm run build:ts
npm run build:webpack
```

`build:ts` emits the Node-oriented package entry at `dist/index.js`. `build:webpack` sends the same source through `ts-loader` and webpack to create the optimized standalone `dist/bundle.js`. `npm run watch` continuously rebuilds the direct TypeScript output.

There is currently no automated test suite: `npm test` intentionally exits with an error. For each change, run lint and the build path affected by the change, inspect the generated program when runtime behavior changes, then run `git diff --check`. Keep new source under `src/`, update scripts or configuration only when the build contract changes, and do not commit generated output.
