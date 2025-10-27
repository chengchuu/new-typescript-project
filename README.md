# 创建一个新的 TypeScript 项目

## 一、初始化 NPM 项目

```
# npm
npm init

# git
git init
```

## 二、安装 TypeScript

```
npm i typescript --save-dev

# 查看版本
npx tsc --version
```

## 三、初始化配置文件 `tsconfig.json`

```
npx tsc --init
```

<!--more-->

## 四、编译 `.ts`

新建 `index.ts` 文件。

项目目录：

```
├── package.json
├── tsconfig.json
└── src
    └── index.ts
```

文件 `index.ts`：

```
const ProjectName: string = 'new-typescript-project'

function say (): string {
  return `This project is ${ProjectName}.`
}

console.log(say())
```

**编译：**

```
npx tsc src/index.ts
```

**结果：**

```
var ProjectName = 'new-typescript-project';
function say() {
    return "This project is " + ProjectName + ".";
}
console.log(say());
```

监听文件变化：

```
npx tsc -w
```

## 五、使用 Webpack 打包

### 5.1 安装 Webpack

```
npm install webpack webpack-cli -D
```

### 5.2 安装 TypeScript 加载器 `ts-loader`

```
npm install ts-loader -D
```

### 5.3 配置 `webpack.config.js`

```
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module:{
    rules:[
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx']
  }
};
```

### 5.4 打包

```
npx webpack --config webpack.config.js
```

## 六、使用 ESLint 规范代码

### 6.1 安装依赖

```
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 6.2 新增配置文件 `.eslintrc`

```
# shell
touch .eslintrc

# .eslintrc
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ]
}
```

### 6.3 配置忽略文件 `.eslintignore`

```
# shell
touch .eslintignore

# .eslintignore
node_modules
dist
```

### 6.4 `package.json` 中添加检测脚本

```
"lint": "eslint . --ext .ts"
```

### 6.5 运行检测

```
npm run lint
```

报错：

```
~/new-typescript-project/src/index.ts
  1:7  error  Type string trivially inferred from a string literal, remove type annotation  @typescript-eslint/no-inferrable-types
```

修改相应代码：

```
- const ProjectName: string = 'new-typescript-project'
+ const ProjectName = 'new-typescript-project'
```

再次运行通过！

### 6.6 自动修复不规范的代码

脚本添加 `--fix` 选项：

```
"lint-and-fix": "eslint . --ext .ts --fix"
```

### 6.7 添加更多扩展文件

```
"lint-and-fix": "eslint . --ext 'ts,tsx' --fix"
```

## 附录

案例：[GitHub: new-typescript-project](https://github.com/chengchuu/new-typescript-project)
