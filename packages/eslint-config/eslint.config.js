// @ts-check
import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

/**
 * ESLint 配置包本身的配置
 * 用于检查配置文件的代码质量
 */
export default [
  {
    ignores: ["node_modules/**", "dist/**"]
  },

  eslint.configs.recommended,

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2020
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "prettier/prettier": "error"
    }
  },

  prettierConfig
];
