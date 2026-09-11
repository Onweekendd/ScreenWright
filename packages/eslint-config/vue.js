// @ts-check
import baseConfig from "./base.js";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

/**
 * @typedef {import('eslint').Linter.Config} ESLintConfig
 */

/**
 * Vue + TypeScript ESLint 配置
 * 严格遵循原 .eslintrc.js 配置，不添加额外规则
 * @type {ESLintConfig[]}
 */
export default [
  // 继承基础配置
  ...baseConfig,

  // Vue 3 essential 配置（对应原配置的 plugin:vue/vue3-essential）
  ...pluginVue.configs["flat/essential"],

  // Vue + TypeScript 配置
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: "module",
        extraFileExtensions: [".vue"]
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        NodeJS: "readonly"
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      // TypeScript 规则（与 base.js 保持一致）
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-debugger": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_"
        }
      ],
      // Vue
      "vue/no-v-html": "off",
      "vue/require-default-prop": "off",
      "vue/require-explicit-emits": "off",
      "vue/multi-word-component-names": "off",
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always"
          },
          svg: "always",
          math: "always"
        }
      ],
      // Prettier（Vue 文件也需要）
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto"
        }
      ]
    }
  }
];
