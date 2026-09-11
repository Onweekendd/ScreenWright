/**
 * vue-part 组件的 SFC 序列化与解析（无状态纯函数）。
 *
 * 落盘时把后端 generate 工厂字符串包成带类型锚点的 .vue，供 agent 用 vue-tsc 做类型检查
 * （serializeVuePartSFC）；读回来时再按哨兵剥除，还原后端期望的 generate(info) 字符串
 * （parseSFCToParts）。两个方向放在同一个文件里，是因为锚点的注入与剥除必须一字不差地对上。
 */

export const VUE_PART_PROP = "vue-part";

/**
 * 注入到 vue-part <script> 的类型锚点（方案 B）：
 * - 给 generate 加 @param/@returns JSDoc，类型从 @vue-part（workspace/tsconfig.json 的 paths 别名 → types/vue-part.ts）引入；
 * - 末尾追加 export default generate(...)，让 vue-tsc 把返回值识别为真组件，<template> 内变量不再误报未定义。
 * 两段均带哨兵标记（@__vp_types__ / @__vp_anchor__），读回来时由本文件的 parseSFCToParts 按哨兵原样剥除，
 * 还原出后端期望的 generate(info) 工厂字符串。generate 函数体本身保持一字不动。
 */
const VP_TYPES_JSDOC = `/**
 * @param {import('@vue-part').VuePartInfo} info
 * @returns {import('@vue-part').Vue2ComponentOptions}
 * @__vp_types__
 */`;
const VP_ANCHOR = `export default generate(/** @type {any} */ ({})); // @__vp_anchor__`;

/** 剥除已注入的类型锚点，得到纯净 js（写盘前幂等、回推时还原共用） */
export const stripVuePartTypeAnchors = (js: string): string =>
  js
    .replace(/\/\*\*[\s\S]*?@__vp_types__[\s\S]*?\*\/\n?/g, "")
    .replace(/\n?export default generate\([^\n]*\);[^\n]*@__vp_anchor__[^\n]*/g, "")
    .trim();

/** 给 generate 函数注入类型锚点；无 generate 声明时原样返回（避免锚点引用未定义符号导致检查报错） */
const injectVuePartTypeAnchors = (js: string): string => {
  const clean = stripVuePartTypeAnchors(js);
  const generateRe = /(^|\n)([ \t]*)function\s+generate\s*\(/;
  if (!generateRe.test(clean)) {
    return clean;
  }
  const withJsdoc = clean.replace(
    generateRe,
    (_m, lead: string, indent: string) =>
      `${lead}${indent}${VP_TYPES_JSDOC.split("\n").join(`\n${indent}`)}\n${indent}function generate(`
  );
  return `${withJsdoc}\n\n${VP_ANCHOR}`;
};

/**
 * .vue SFC → template/js/css 三段，与 {@link serializeVuePartSFC} 反向对称。
 *
 * template 保留外层 `<template>` 标签（后端 option.template 字段本身就带），且**贪婪匹配**到
 * 最外层闭合，兼容历史上双层 <template> 的文件不被非贪婪截断；js/css 取标签内部（后端字段不含标签）。
 * js 走 {@link stripVuePartTypeAnchors} 剥掉落盘时注入的锚点——这两处此前各写了一份相同的正则，
 * 改了注入忘了改剥除，锚点就会跟着组件数据一路推到前端。
 */
export const parseSFCToParts = (vueContent: string): { template: string; js: string; css: string } => ({
  template: vueContent.match(/<template>[\s\S]*<\/template>/)?.[0]?.trim() ?? "",
  js: stripVuePartTypeAnchors(vueContent.match(/<script>([\s\S]*?)<\/script>/)?.[1]?.trim() ?? ""),
  css: vueContent.match(/<style>([\s\S]*?)<\/style>/)?.[1]?.trim() ?? ""
});

/** 将 vue-part 的 template/js/css 序列化为 .vue SFC 格式（js 注入类型锚点供 agent 类型检查） */
export const serializeVuePartSFC = (template: string, js: string, css: string): string => {
  const sections: string[] = [];
  // 后端 option.template 字段本身已带 <template> 包裹，直接使用，避免重复包裹导致 SFC 双层 <template> 嵌套
  const templateSection = /^\s*<template[\s>]/.test(template)
    ? template.trim()
    : `<template>\n${template}\n</template>`;
  sections.push(templateSection);
  sections.push(`<script>\n${injectVuePartTypeAnchors(js)}\n</script>`);
  sections.push(`<style>\n${css}\n</style>`);
  return sections.join("\n\n");
};
