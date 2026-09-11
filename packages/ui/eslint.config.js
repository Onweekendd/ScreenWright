// @ts-check
import vueConfig from "@screenwright/eslint-config/vue"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...vueConfig,

  // 项目特定的忽略规则
  {
    ignores: ["dist/**", "node_modules/**", "public/**", "**/*.d.ts"]
  }
]
