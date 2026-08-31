<!-- omit from toc -->
# 从零到一: 创建一个 TypeScript 7 项目

![创建一个 TypeScript 7 项目](http://blog.mazey.net/wp-content/uploads/2020/08/TypeScript_SF_7x3.jpg)

本文介绍如何从零创建一个基于 TypeScript 7 的 Node.js 项目。项目使用 ECMAScript 模块 (ESM)，并提供两条构建路径。TypeScript 编译器负责生成可发布文件，webpack 负责生成独立的 bundle。

- [准备开发环境](#准备开发环境)
- [安装 TypeScript 和开发工具](#安装-typescript-和开发工具)
- [配置 TypeScript 7](#配置-typescript-7)
- [编写并编译 TypeScript](#编写并编译-typescript)
- [使用 webpack 打包](#使用-webpack-打包)
- [配置 ESLint](#配置-eslint)
- [完整验证项目](#完整验证项目)
- [参考资料](#参考资料)
- [附录](#附录)

## 准备开发环境

请先确保已安装 Node.js，检查本地版本:

```bash
node --version
```

初始化项目:

```bash
mkdir new-typescript-project
cd new-typescript-project
npm init --yes
```

项目完成后的主要目录如下:

```plain
├── package.json
├── tsconfig.json
├── webpack.config.js
└── src
    └── index.ts
```

## 安装 TypeScript 和开发工具

TypeScript 7 的编译器使用 Go 重写为原生实现。`tsc` 可以直接执行编译和类型检查，但 TypeScript 7 暂未提供稳定的编程 API。`ts-loader` 和 typescript-eslint 等工具仍需通过编程 API 调用编译器，因此暂时依赖 TypeScript 6。

为帮助现有工具平稳过渡，TypeScript 团队发布了 `@typescript/typescript6` 兼容包。该兼容包可以让 TypeScript 7 的 `tsc` 与依赖 TypeScript 6 API 的工具并行运行。具体背景参阅 [TypeScript 7.0 发布公告](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)。

本项目据此并行安装两个版本:

- `@typescript/native` 是 `typescript@7.0.2` 的别名，负责 `tsc`、直接构建、监听和类型检查。
- `typescript` 是 `@typescript/typescript6@6.0.2` 的别名，向 webpack、`ts-loader` 和 typescript-eslint 提供兼容 API。该依赖还提供 `tsc6` 命令，对应的编译器版本为 6.0.3。

安装开发依赖:

```bash
npm install --save-dev \
  "@eslint/js@^9.39.5" \
  "@typescript/native@npm:typescript@7.0.2" \
  "eslint@^9.39.5" \
  "eslint-config-prettier@^10.1.8" \
  "prettier@^3.9.6" \
  "ts-loader@^9.6.2" \
  "typescript@npm:@typescript/typescript6@6.0.2" \
  "typescript-eslint@^8.67.0" \
  "webpack@^5.109.2" \
  "webpack-cli@^7.2.2"
```

安装完成后，`package.json` 会包含以下开发依赖:

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

随后，可以检查两个编译器的版本:

```bash
npm exec -- tsc --version
npm exec -- tsc6 --version
```

预期输出:

```plain
Version 7.0.2
Version 6.0.3
```

## 配置 TypeScript 7

在 `package.json` 中声明 ESM，并设置项目的入口文件和发布内容:

```json
{
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "src"]
}
```

创建 `tsconfig.json`:

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

`tsconfig.json` 是 TypeScript 7 直接构建和 webpack 构建共用的项目配置。`NodeNext` 会结合 `package.json` 中的 `"type": "module"` 判断模块格式，使 `dist/index.js` 保持 ESM 格式。

## 编写并编译 TypeScript

创建 `src/index.ts`:

```typescript
const ProjectName = "new-typescript-project";

function say(): string {
  return `This project is ${ProjectName}.`;
}

console.log(say());
```

在 `package.json` 中定义直接构建、监听和类型检查脚本:

```json
{
  "scripts": {
    "build:ts": "tsc --project tsconfig.json",
    "watch": "tsc --project tsconfig.json --watch",
    "typecheck": "tsc --project tsconfig.json --noEmit"
  }
}
```

运行直接构建:

```bash
npm run build:ts
```

TypeScript 7 会生成 `dist/index.js`、声明文件、声明映射和源码映射。`dist/index.js` 的内容如下:

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

运行编译结果:

```bash
node dist/index.js
```

输出如下:

```plain
This project is new-typescript-project.
```

开发期间可以启动监听模式:

```bash
npm run watch
```

只检查类型而不写入文件:

```bash
npm run typecheck
```

## 使用 webpack 打包

对于当前 Node.js 项目，TypeScript 7 直接编译已经足够。webpack 是一条可选的构建路径。

`tsc` 负责类型检查和 JavaScript 编译，也会生成声明文件与源码映射。在本项目的 `NodeNext` 配置下，`tsc` 会保留模块边界，不会把入口文件及其依赖合并为单个文件。

webpack 会从入口开始分析模块依赖，并将项目代码和引用的模块合并为 `dist/bundle.js`。对于包含多个模块或第三方依赖的应用，单文件通常更便于交付。

配置相应的 loader 或 plugin 后，webpack 还可以处理 CSS、图片等资源。本文没有启用这些能力。

webpack 通过 `ts-loader` 加载 TypeScript。`ts-loader` 会从名为 `typescript` 的依赖中获取 TypeScript 6 兼容 API。webpack 仍使用同一个 `tsconfig.json`。更多配置方式请参阅 [webpack TypeScript 指南](https://webpack.js.org/guides/typescript/)。

创建 ESM 格式的 `webpack.config.js`:

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

webpack 构建会关闭声明文件输出。包文件和声明文件仍由 TypeScript 7 直接构建生成。

添加 webpack 构建脚本:

```json
{
  "scripts": {
    "build:webpack": "webpack --config webpack.config.js"
  }
}
```

运行构建并执行生成的 bundle:

```bash
npm run build:webpack
node dist/bundle.js
```

webpack 会同时生成 `dist/bundle.js` 和 `dist/bundle.js.map`。

## 配置 ESLint

ESLint 使用 flat config，并组合 `@eslint/js` 和 typescript-eslint 的推荐规则。具体配置方式参阅 [typescript-eslint 入门指南](https://typescript-eslint.io/getting-started/)。

运行检查:

```bash
npm run lint
```

## 完整验证项目

`check` 是仓库健康检查。该脚本会依次检查格式、代码质量和类型，然后运行两条构建路径:

```json
{
  "scripts": {
    "check": "npm run format:check && npm run lint && npm run typecheck && npm run build:ts && npm run build:webpack"
  }
}
```

执行完整检查:

```bash
npm run check
```

构建完成后，分别运行两个文件并比较输出:

```bash
node dist/index.js
node dist/bundle.js
```

两个命令都应输出:

```plain
This project is new-typescript-project.
```

## 参考资料

- [TypeScript 7.0 发布公告](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [webpack TypeScript 指南](https://webpack.js.org/guides/typescript/)
- [typescript-eslint 入门指南](https://typescript-eslint.io/getting-started/)
- [GitHub: new-typescript-project](https://github.com/chengchuu/new-typescript-project)

## 附录

案例: [GitHub: new-typescript-project](https://github.com/chengchuu/new-typescript-project)

**版权声明**

本文为原创文章，作者保留版权。转载请保留本文完整内容，并以超链接形式注明作者及原文出处。

作者: [除除](https://github.com/chengchuu)
原文: <https://blog.mazey.net/6532.html>

<!-- ID: new-typescript-project/README -->

```plain
#TypeScript #TypeScript7 #ESM #webpack #ESLint #JavaScript #WebDevelopment #前端工程化 #构建工具 #项目初始化
```
