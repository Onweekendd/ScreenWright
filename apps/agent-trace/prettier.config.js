import baseConfig from "@screenwright/eslint-config/prettier";

/**
 * 继承共享 Prettier 配置，仅为本 Next + Tailwind 项目追加 class 排序插件，
 * 不影响其它继承同一份共享配置的包。
 * @type {import("prettier").Config}
 */
export default {
  ...baseConfig,
  plugins: ["prettier-plugin-tailwindcss"]
};
