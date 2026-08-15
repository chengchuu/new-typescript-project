# TypeScript 7 upgrade plan

## Status and objective

Status: Completed

Upgrade the command-line compiler directly from TypeScript 5.9.3 to 7.0.2, move the package from CommonJS to ECMAScript modules (ESM), and refresh the Chinese tutorial around current TypeScript, webpack, ESLint, and Prettier practices. Preserve the existing console output and both build paths.

TypeScript 7.0 does not expose the compiler API required by `ts-loader` and typescript-eslint. Use Microsoft’s supported side-by-side arrangement: TypeScript 7 owns `tsc`, while TypeScript 6 provides the temporary programmatic API used by webpack and ESLint.

## Locked decisions

- Require Node.js 22 or later. Add `"engines": { "node": ">=22" }` and use Node.js 22 for validation.
- Install dependencies with npm. Do not add a `packageManager` field.
- Run project tasks through `npm run`; remove unnecessary `npx` calls from package scripts.
- Install TypeScript 7 as `"@typescript/native": "npm:typescript@7.0.2"` and the compatibility API as `"typescript": "npm:@typescript/typescript6@6.0.2"`. The compatibility package exposes a compiler that reports version 6.0.3.
- Add `"type": "module"`. Keep `dist/index.js` as `main`, but treat the loss of CommonJS `require()` support as an accepted breaking change.
- Keep `src/index.ts` and its observable message unchanged.
- Keep webpack and `ts-loader`. Do not replace them with another bundler or transpiler.
- Remove the placeholder `npm test` script. Use `npm run check` as the repository health check without claiming that the project has automated tests.

## Implementation

### Modernize the compiler and package scripts

Update `package.json` to use the two compiler packages and the current flat-config ESLint packages. Replace the separate `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` dependencies with `typescript-eslint`. Replace `eslint-plugin-prettier` with `prettier` and `eslint-config-prettier` so formatting runs independently from linting.

Define these task contracts:

- `build:ts`: compile the project with TypeScript 7 and emit package artifacts.
- `build:webpack`: bundle `src/index.ts` through webpack and the TypeScript 6 compatibility API.
- `watch`: run the TypeScript 7 project compiler in watch mode.
- `typecheck`: run TypeScript 7 with `--noEmit`.
- `lint` and `lint:fix`: inspect the repository with ESLint flat config.
- `format` and `format:check`: write or check supported files with Prettier.
- `check`: run formatting, linting, type-checking, and both builds in a deterministic order.

Configure `tsconfig.json` as the single project source of truth. Set `rootDir` to `src`, `outDir` to `dist`, include the TypeScript source tree, and exclude dependencies and generated output. Retain strict checking, declarations, declaration maps, and source maps. Use `NodeNext` module behavior with an explicit Node.js 22-compatible ECMAScript target; the package-level ESM declaration must cause `dist/index.js` to be emitted as ESM.

### Update webpack, ESLint, and Prettier

Convert `webpack.config.js` to ESM syntax. Preserve the TypeScript entry and `dist/bundle.js` output, and enable source-map generation. Do not enable webpack output cleaning because that could delete the direct TypeScript artifacts in the shared `dist/` directory.

Replace `eslint.config.cjs` with an ESM flat configuration based on `@eslint/js`, `typescript-eslint`, and `eslint-config-prettier`. Apply recommended JavaScript and TypeScript rules, ignore dependencies and generated output, and continue to allow the intentional `console.log` call. Remove the Node.js `structuredClone` polyfill because Node.js 22 supplies it.

Add a minimal Prettier configuration and ignore generated output. Keep formatting and linting as separate checks.

### Rewrite the README and contributor guide

Rewrite `README.md` as a reproducible Simplified Chinese tutorial. Cover Node.js 22, project initialization, dependency installation, TypeScript 7 configuration, compilation, watch mode, webpack, ESLint, Prettier, and complete validation. Use npm for dependency installation and repository scripts without turning the TypeScript tutorial into a package-manager guide.

Explain the TypeScript 7 and TypeScript 6 sidecar roles before the installation command. Link to the official TypeScript 7 announcement and current webpack, typescript-eslint, and Prettier guidance. Replace the ES5-era compiled-code example with output copied from the validated TypeScript 7 build. Remove the Node.js 16 claim and update the article date only after all checks pass.

Update `AGENTS.md` to describe the ESM contract, project-based compiler flow, separate lint and formatting checks, compatibility compiler, and new `npm run check` contract.

## Validation and acceptance criteria

1. Run `npm install` to install the declared dependencies.
2. Confirm `tsc --version` reports `7.0.2` and `tsc6 --version` reports `6.0.3` through the local toolchain.
3. Run `npm run format:check`, `npm run lint`, and `npm run typecheck`.
4. Run `npm run build:ts`, then execute `node dist/index.js` and verify the existing message.
5. Run `npm run build:webpack`, then execute `node dist/bundle.js` and verify the same message.
6. Confirm the direct build emits JavaScript, declarations, declaration maps, and source maps. Confirm webpack emits its bundle and source map without deleting direct-build artifacts.
7. Run the aggregate `npm run check` from a consistent installed state.
8. Compare the README’s commands, configuration, and output snippets with the validated files.
9. Run `git diff --check` and inspect `git status --short`.

The migration is complete only when the TypeScript 7 CLI, TypeScript 6 compatibility tools, direct ESM output, webpack bundle, lint configuration, formatting checks, and documentation all pass together on Node.js 22.

## Risks and boundaries

- ESM conversion breaks consumers that load the package with `require()`.
- Contributors may mistake the compatibility package for the primary compiler. Keep the roles explicit in scripts and documentation.
- `dist/` is shared by two build paths. Webpack must not clean it automatically.
- TypeScript 7 ecosystem compatibility is transitional. Reassess the TypeScript 6 sidecar when TypeScript exposes a stable compiler API and the dependent tools support it.
- Do not change runtime output, add application features or tests, publish the package, or modify external repositories as part of this migration.

## References

- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [webpack TypeScript guide](https://webpack.js.org/guides/typescript/)
- [typescript-eslint getting started](https://typescript-eslint.io/getting-started/)
- [Prettier integration with linters](https://prettier.io/docs/next/integrating-with-linters.html)
