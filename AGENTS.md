# Repository guide

## Project structure

This repository is a minimal TypeScript ESM example rather than a multi-component application.

- `src/index.ts` is the only maintained runtime source and application entry point. Keep its observable console message unchanged unless a task explicitly changes runtime behavior.
- `dist/` contains ignored output shared by the direct TypeScript and webpack builds. Do not edit or commit it, and do not enable webpack output cleaning.
- `package.json` declares the ESM package contract, Node.js 22 minimum, dependency versions, task scripts, JavaScript entry point (`dist/index.js`), declaration entry point (`dist/index.d.ts`), and published `dist/` plus `src/` files. No CommonJS build is provided.
- `README.md` is a reproducible Simplified Chinese tutorial for the current TypeScript, webpack, ESLint, and Prettier setup.
- `site/` contains the maintained Simplified Chinese Pages template, route metadata, semantic styles, and theme behavior. Keep local asset references relative to the project subpath.
- `scripts/build-site.mjs` generates the complete ignored `site-dist/` artifact. `scripts/validate-site.mjs` checks the artifact, theme scenarios, and deployment contract. Do not edit or commit `site-dist/`.
- `.github/workflows/pages.yml` checks the package and site, uploads only `site-dist/`, and deploys it through the protected `github-pages` environment. It must not publish the npm package.
- `.vscode/settings.json` only customizes the editor window title.

## Compiler and runtime contracts

The repository uses two TypeScript packages during the TypeScript 7 transition:

- `@typescript/native` aliases TypeScript 7 and owns the local `tsc` command. It performs direct builds, watch mode, and type-checking.
- `typescript` aliases `@typescript/typescript6` and exposes the temporary TypeScript 6 compiler API required by `ts-loader` and typescript-eslint. It also provides the `tsc6` command.

Both compiler paths load `tsconfig.json` as the single project source of truth. It uses `NodeNext` module behavior, targets the Node.js 22-compatible ES2023 language level, reads `src/**/*.ts`, and writes direct-build artifacts to `dist/`. JavaScript source maps embed their TypeScript sources, while published `src/` files support declaration-map navigation. The package-level `"type": "module"` declaration causes `dist/index.js` to be emitted as ESM.

`src/index.ts` declares `ProjectName`, passes it into the `say()` template string through lexical scope, and writes the returned message to standard output with `console.log`. There are no external inputs, APIs, persistent stores, browser components, or asynchronous operations.

## Tooling configuration

- `webpack.config.js` is ESM. It loads `.ts` and `.tsx` files through `ts-loader`, produces `dist/bundle.js` and its source map, disables TypeScript 6 declaration emission, and deliberately leaves existing `dist/` files intact.
- `eslint.config.js` is ESM flat config based on ESLint 9, `@eslint/js`, `typescript-eslint`, and `eslint-config-prettier`. ESLint 9 preserves the declared Node.js 22 support range. The config applies recommended JavaScript and TypeScript rules, permits the intentional console output, and ignores dependencies and generated output.
- `.prettierrc.json` provides the minimal Prettier configuration. `.prettierignore` excludes dependencies and generated output.
- ESLint checks code quality and Prettier checks formatting. Keep these responsibilities separate.

## Build and validation workflow

Use Node.js 22 or later. Install dependencies from the repository root:

```bash
npm install
```

Run repository tasks through the package scripts:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build:ts
npm run build:webpack
npm run check
npm run build:site
npm run validate:site
npm run check:site
```

`build:ts` uses the TypeScript 7 project compiler and emits `dist/index.js`, declarations, declaration maps, and source maps. `build:webpack` sends the same source and project configuration through the TypeScript 6 compatibility API and emits `dist/bundle.js` plus its source map. Run `node dist/index.js` and `node dist/bundle.js` when runtime behavior changes; both must print the same message.

`npm run watch` starts the TypeScript 7 project compiler in watch mode. `npm run format` and `npm run lint:fix` write changes, so inspect their scope before using them.

`npm pack` and `npm publish` remove only the generated `dist/` directory, then run `npm run check` through the `prepack` lifecycle. This prevents stale package files and guarantees that ignored artifacts exist before packaging. Use `npm pack --dry-run` to inspect the release contents without publishing.

`build:site` rebuilds `site-dist/` from maintained files. `validate:site` checks the generated route, SEO and crawler metadata, exact external asset tags, local assets, theme fallbacks, and Pages workflow. `check:site` runs both commands. Keep `npm run check` and `prepack` package-only.

The repository has no automated test suite. `npm run check` is the health-check contract and must not be described as a test command. For each change, run the focused checks plus the aggregate check, then run `git diff --check` and inspect `git status --short`. Keep maintained source under `src/`, change build configuration only when the build contract changes, and do not commit generated output.
