/**
 * Screenwright Figma 插件常量定义
 */

/**
 * 规范后缀列表
 * - -panel: 面板容器
 * - -merge: 合并框架（状态容器）
 * - -status: 状态节点
 * - -subtab: 子标签
 * - -image: 图片节点
 * - -group: 分组
 * - -exhibition: 展览相关
 */
export const SPEC_SUFFIXES = ["-panel", "-merge", "-status", "-subtab", "-image", "-group", "-exhibition"];

/**
 * 边界容差值（像素）
 * 用于判断两个节点的边界是否"足够接近"
 */
export const BOUNDS_TOLERANCE = 10;
