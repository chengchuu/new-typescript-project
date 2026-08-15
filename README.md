# 从零到一：创建一个新的 TypeScript 项目

本文介绍如何创建一个基于 TypeScript 7 的 Node.js 项目。项目使用 ECMAScript 模块 (ESM)，并保留两条构建路径：TypeScript 编译器生成可发布文件，webpack 生成独立 bundle。

## 准备开发环境

请先安装以下工具：

- Node.js 22 或更高版本
- Git

检查本地版本：

```bash
node --version
git --version
```

初始化项目和 Git 仓库：

```bash
mkdir new-typescript-project
cd new-typescript-project
npm init --yes
npm pkg delete scripts.test
git init
```

随后删除占位的 `test` 脚本，因为本项目没有自动化测试套件。

项目完成后的主要目录如下：

```plain
├── package.json
├── tsconfig.json
├── webpack.config.js
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
└── src
    └── index.ts
```

## 安装 TypeScript 和开发工具

TypeScript 7 使用 Go 重写为原生编译器，`tsc` 可以直接用于编译和类型检查。但是，7.0 暂未提供编程 API。`ts-loader` 和 typescript-eslint 等工具仍需通过该 API 调用编译器，因此暂时依赖 TypeScript 6。为帮助项目平稳过渡，TypeScript 团队发布了 `@typescript/typescript6` 兼容包，并建议让 TypeScript 7 的 `tsc` 与依赖 TypeScript 6 API 的工具并行运行。具体背景参阅 [TypeScript 7.0 发布公告](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)。

本项目据此并行安装两个版本：

- `@typescript/native` 是 `typescript@7.0.2` 的别名，负责 `tsc`、直接构建、监听和类型检查。
- `typescript` 是 `@typescript/typescript6@6.0.2` 的别名，向 webpack、`ts-loader` 和 typescript-eslint 提供兼容 API。该包提供 `tsc6` 命令，编译器版本为 6.0.3。

在 `package.json` 中配置开发依赖：

```json
{
  "devDependencies": {
    "@eslint/js": "^9.39.5",
    "@typescript/native": "npm:typescript@7.0.2",
    "eslint": "^9.39.5",
    "eslint-config-prettier": "^10.1.8",
    "prettier": "^3.9.6",
    "ts-loader": "^9.6.2",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "^8.67.0",
    "webpack": "^5.109.2",
    "webpack-cli": "^7.2.2"
  }
}
```

项目使用 ESLint 9。

安装依赖：

```bash
npm install
```

安装完成后，可以直接检查本地编译器版本：

```bash
npm exec -- tsc --version
npm exec -- tsc6 --version
```

预期输出：

```plain
Version 7.0.2
Version 6.0.3
```

## 配置 TypeScript 7

在 `package.json` 中声明 ESM 和 Node.js 版本要求：

```json
{
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "src"],
  "engines": {
    "node": ">=22"
  }
}
```

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "module": "NodeNext",
    "target": "ES2023",
    "types": [],
    "sourceMap": true,
    "inlineSources": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

该文件是 TypeScript 两类任务的唯一项目配置来源。`NodeNext` 会结合 `package.json` 中的 `"type": "module"`，让 `dist/index.js` 保持 ESM 格式。项目不提供 CommonJS 构建。部分 Node.js 版本可以通过 `require()` 加载 ESM，但这属于运行时的互操作能力。

## 编写并编译 TypeScript

创建 `src/index.ts`：

```typescript
const ProjectName = "new-typescript-project";

function say(): string {
  return `This project is ${ProjectName}.`;
}

console.log(say());
```

在 `package.json` 中定义直接构建、监听和类型检查脚本：

```json
{
  "scripts": {
    "build:ts": "tsc --project tsconfig.json",
    "watch": "tsc --project tsconfig.json --watch",
    "typecheck": "tsc --project tsconfig.json --noEmit"
  }
}
```

运行直接构建：

```bash
npm run build:ts
```

TypeScript 7 会生成 `dist/index.js`、声明文件、声明映射和源码映射。`dist/index.js` 的内容如下：

<!-- prettier-ignore -->
```javascript
const ProjectName = "new-typescript-project";
function say() {
    return `This project is ${ProjectName}.`;
}
console.log(say());
export {};
//# sourceMappingURL=index.js.map
```

运行编译结果：

```bash
node dist/index.js
```

输出如下：

```plain
This project is new-typescript-project.
```

开发期间可以启动监听模式：

```bash
npm run watch
```

只检查类型而不写入文件：

```bash
npm run typecheck
```

## 使用 webpack 打包

webpack 通过 `ts-loader` 加载 TypeScript。相关工具会从名为 `typescript` 的依赖中获取 TypeScript 6 兼容 API，但项目配置仍来自同一个 `tsconfig.json`。更多配置方式请参阅 [webpack TypeScript 指南](https://webpack.js.org/guides/typescript/)。

创建 ESM 格式的 `webpack.config.js`：

```javascript
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: "production",
  entry: "./src/index.ts",
  devtool: "source-map",
  output: {
    filename: "bundle.js",
    path: path.resolve(currentDirectory, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            compilerOptions: {
              declaration: false,
              declarationMap: false,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx"],
  },
};
```

配置没有启用 `output.clean`。直接构建和 webpack 共用 `dist/`，自动清理会删除另一条构建路径生成的文件。webpack 也会关闭声明文件输出，确保只有 TypeScript 7 写入包声明。

添加并运行构建脚本：

```json
{
  "scripts": {
    "build:webpack": "webpack --config webpack.config.js"
  }
}
```

```bash
npm run build:webpack
node dist/bundle.js
```

程序仍会输出：

```plain
This project is new-typescript-project.
```

webpack 会同时生成 `dist/bundle.js` 和 `dist/bundle.js.map`。

## 配置 ESLint

ESLint 使用 flat config，并组合 `@eslint/js` 和 typescript-eslint 的推荐规则。有关配置方式，请参阅 [typescript-eslint 入门指南](https://typescript-eslint.io/getting-started/)。

运行检查：

```bash
npm run lint
```

在确认修复范围后，可以自动修复 ESLint 支持的问题：

```bash
npm run lint:fix
```

## 完整验证项目

项目没有自动化测试套件。`check` 是仓库健康检查，他会依次检查格式、代码质量和类型，然后运行两条构建路径：

```json
{
  "scripts": {
    "clean": "node --eval \"require('node:fs').rmSync('dist', { recursive: true, force: true })\"",
    "check": "npm run format:check && npm run lint && npm run typecheck && npm run build:ts && npm run build:webpack",
    "prepack": "npm run clean && npm run check"
  }
}
```

执行完整检查：

```bash
npm run check
```

构建完成后，分别运行两个文件并比较输出：

```bash
node dist/index.js
node dist/bundle.js
```

两个命令都应输出：

```plain
This project is new-typescript-project.
```

`prepack` 会在 `npm pack` 和 `npm publish` 前清理 `dist/`，然后执行完整检查。这样可以重新生成发布文件，并避免打包残留文件。`files` 字段会加入 `dist/` 和 `src/`，确保声明映射可以找到 TypeScript 源文件。npm 也会保留 `package.json` 和 `README.md`。发布前可以检查包内容：

```bash
npm pack --dry-run
```

## 参考资料

- [TypeScript 7.0 发布公告](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [webpack TypeScript 指南](https://webpack.js.org/guides/typescript/)
- [typescript-eslint 入门指南](https://typescript-eslint.io/getting-started/)
- [GitHub：new-typescript-project](https://github.com/chengchuu/new-typescript-project)

本文章首次编辑于 2020-08-18，最近更新于 2026-08-15。
