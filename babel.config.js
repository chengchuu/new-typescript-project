module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          // "usage" 会在代码中按需注入 core-js polyfills (适合应用)
          // "entry" 需要手动在入口 import "core-js/stable"; import "regenerator-runtime/runtime";
          // 或者把 useBuiltIns 改为 false (不注入 polyfill)
          useBuiltIns: false, // 或 "usage" / "entry"
          corejs: 3,
          // 可以根据需要设置 targets，也可由 browserslist 决定
          // targets: { browsers: [">0.2%", "not dead", "not op_mini all"] },
          bugfixes: true,
          modules: false
        }
      ],
      "@babel/preset-typescript"
    ],
    plugins: [
      // 推荐用于库，抽出 helper，减少重复代码；如果需要 core-js 注入，配置 corejs 选项
      [
        "@babel/plugin-transform-runtime",
        {
          corejs: false, // 或 3 表示把 core-js polyfills 用 runtime 方式注入 (需要 @babel/runtime-corejs3)
          helpers: true,
          regenerator: true,
          version: require("@babel/runtime/package.json").version
        }
      ],

      // class fields、private fields 等 (现代 JS 特性)
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-private-methods",
      "@babel/plugin-proposal-object-rest-spread"
    ]
  };
};
