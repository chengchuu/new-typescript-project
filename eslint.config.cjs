// Temporary structuredClone polyfill for older Node (prefer upgrading Node to >=18)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');
const tsRecommendedRules =
  tsPlugin && tsPlugin.configs && tsPlugin.configs.recommended
    ? tsPlugin.configs.recommended.rules
    : {};

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '*.min.js', '.git/**']
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...tsRecommendedRules,
      'prettier/prettier': 'error',
      'no-console': 'off',
      '@typescript-eslint/no-inferrable-types': 'off'
    }
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': 'warn'
    }
  }
];
