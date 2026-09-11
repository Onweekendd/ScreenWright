// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

/**
 * @typedef {import('eslint').Linter.Config} ESLintConfig
 */

/**
 * 基础 ESLint 配置 - 支持 JavaScript 和 TypeScript
 * 严格遵循原 .eslintrc.js 配置，不添加额外规则
 * @type {ESLintConfig[]}
 */
export default [
  // 忽略的文件和目录
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "build/**", // 只忽略根目录的 build 文件夹
      "**/.cache/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/eslint.config.js",
      "**/vite.config.ts",
      "**/vitest.config.ts"
    ]
  },

  // JavaScript 推荐配置
  eslint.configs.recommended,

  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error"
    }
  },
  // 全局配置
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        parser: tseslint.parser
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020
      }
    },
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin
    },
    rules: {
      // Import
      "import/no-cycle": ["error", { maxDepth: 10 }],
      // TS
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-debugger": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "no-unused-vars": "off",
      // Prettier
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto"
        }
      ]
    }
  },

  // Prettier 配置（需要放在最后以覆盖其他配置）
  prettierConfig,

  // 放在 prettierConfig 之后，避免 eslint-config-prettier 把 curly 关闭
  {
    rules: {
      curly: ["error", "all"]
    }
  }
];
