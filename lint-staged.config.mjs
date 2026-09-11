/**
 * pre-commit 的 lint 环节。类型检查与测试由 `test:staged` 把关（turbo 的 test
 * dependsOn check-types），这里只负责 lint。
 *
 * 【为什么不再传 --max-warnings 0】它与规则本身的严重级别自相矛盾：
 * no-explicit-any 被配成 warn，说明团队容忍它；--max-warnings 0 又把每个 warning
 * 当硬错误，等于把 warn 偷偷提成 error。后果是「碰了某个文件就得为它的全部历史欠账负责」——
 * 实测仅 packages/types 的 ComponentType 就有 13 处 any，而它们是索引签名和泛型默认值，
 * 改成 unknown 会让全仓库所有 `component.someField` 失效，属于改不得的设计选择。
 *
 * 现在的门槛：eslint 的 error 仍然拦（可自动修的由 --fix 就地修掉），warning 只提示不阻塞；
 * 真正的质量闸口是类型检查和单测。
 */
export default {
  "apps/app/**/*.{vue,js,jsx,ts,tsx}":
    "pnpm --dir apps/app exec eslint --cache --fix",

  "apps/agent-trace/**/*.{vue,js,jsx,ts,tsx}":
    "pnpm --dir apps/agent-trace exec eslint --cache --fix",

  "packages/core/**/*.{js,jsx,ts,tsx}":
    "pnpm --dir packages/core exec eslint --cache --fix",

  "packages/composables/**/*.{js,jsx,ts,tsx}":
    "pnpm --dir packages/composables exec eslint --cache --fix",

  "packages/types/**/*.{js,jsx,ts,tsx}":
    "pnpm --dir packages/types exec eslint --cache --fix",

  "packages/material/**/*.{vue,js,jsx,ts,tsx}":
    "pnpm --dir packages/material exec eslint --cache --fix",

  "packages/ui/**/*.{vue,js,jsx,ts,tsx}":
    "pnpm --dir packages/ui exec eslint --cache --fix",

  "packages/codeEditor/**/*.{vue,js,jsx,ts,tsx}":
    "pnpm --dir packages/codeEditor exec eslint --cache --fix",

  "packages/figma-helper/**/*.{js,jsx,ts,tsx}":
    "pnpm --dir packages/figma-helper exec eslint --cache --fix",

  "servers/server/**/*.{js,jsx,ts,tsx}":
    "pnpm --dir servers/server exec eslint --cache --no-warn-ignored --fix",
};
