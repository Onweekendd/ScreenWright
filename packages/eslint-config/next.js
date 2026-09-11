// @ts-check
import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginPrettier from "eslint-plugin-prettier";
import pluginImport from "eslint-plugin-import";
import globals from "globals";
import tseslint from "typescript-eslint";

import baseConfig from "./base.js";

/**
 * @typedef {import('eslint').Linter.Config} ESLintConfig
 */

/**
 * ESLint flat config 中插件对象的类型——各插件导出形态略有差异（例如 react-hooks
 * 内嵌的 configs 字段），统一放宽为任意插件对象以通过 `@ts-check`。
 * @typedef {Record<string, import('eslint').ESLint.Plugin>} PluginsMap
 */

/**
 * Next.js（App Router）+ React + TypeScript ESLint 配置。
 *
 * 采用 create-next-app 风格组织，在共享基础配置 base.js（已含 @eslint/js、
 * typescript-eslint recommended、prettier 插件、import、consistent-type-imports 等）
 * 之上，叠加 React、React Hooks 与 Next.js 官方规则。供 apps/agent-trace 等 Next
 * 项目直接引用（`@screenwright/eslint-config/next`）。
 *
 * 相对 create-next-app 原模板的兼容性调整：
 * - base.js 为默认导出 → 用默认导入；本配置同样保持默认导出，apps/agent-trace 现有
 *   `import funbiNext from "@screenwright/eslint-config/next"` 无需改动；
 * - 不启用 type-checked（`recommendedTypeChecked` + `projectService`），避免每次 lint
 *   拉起 TS 程序导致慢 5-10 倍、编辑器诊断滞后（这是 agent-trace 此前「不飘红」的根因）；
 * - react-hooks 维持 7.x 的 `recommended-latest`（当前依赖为 ^7.1.1，不降级到模板的 5.x）；
 * - 为 jsx/tsx 补齐 prettier / import 规则（base 仅覆盖 js/ts），保留格式类飘红；
 * - eslint-config-prettier 置于规则链末尾，正确关闭后续 react/next 规则的格式冲突。
 *
 * @type {ESLintConfig[]}
 */
export default [
  // 共享基础配置（JS/TS recommended、prettier、import、consistent-type-imports 等）
  ...baseConfig,

  // TypeScript 推荐规则（非 type-checked）
  ...tseslint.configs.recommended,

  // React 推荐规则 + 新 JSX 运行时（无需在作用域内引入 React）
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.serviceworker
      }
    },
    settings: { react: { version: "detect" } }
  },
  pluginReact.configs.flat["jsx-runtime"],

  // Next.js 官方推荐 + Core Web Vitals 规则
  {
    plugins: {
      "@next/next": pluginNext
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      "react/self-closing-comp": "error"
    }
  },

  // React Hooks 规则。react-hooks 7.x 自带 config 的 plugins 仍是旧式字符串数组，
  // 这里只取其 rules，以对象形式手动挂载插件，兼容 ESLint flat config。
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: /** @type {PluginsMap} */ ({ "react-hooks": pluginReactHooks }),
    rules: {
      ...pluginReactHooks.configs["recommended-latest"].rules,
      "react/react-in-jsx-scope": "off"
    }
  },

  // 让 jsx/tsx 也享有基础配置里的 prettier / import 规则（base 仅覆盖 js/ts），
  // 并关闭 TS 项目中冗余的 prop-types 校验
  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: /** @type {PluginsMap} */ ({ prettier: pluginPrettier, import: pluginImport }),
    rules: {
      "import/no-cycle": ["error", { maxDepth: 10 }],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "react/prop-types": "off"
    }
  },

  // 关闭与 prettier 冲突的格式类规则，需置于所有规则配置之后
  eslintConfigPrettier,

  // Next.js 构建产物与生成文件
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
];
