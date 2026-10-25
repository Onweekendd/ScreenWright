/**
 * agent 建组件时，拿什么去组件菜单里找类型。
 *
 * 必须用 `title`（组件类型名，如「图片」「文本框」），不能用 `name`：`name` 是实例名
 * （agent 起的「天空底图」「左侧云石」），拿它去查必然「不存在组件标识为 天空底图 的组件」——
 * 批量创建曾经用了 `name ?? title`，只要 agent 给组件起了名字，整批全部失败。
 * 没有 title 的旧载荷才退回 name。
 */
export const componentMenuTitle = (component: { title?: unknown; name?: unknown }): string =>
  String(component.title ?? component.name ?? "");
