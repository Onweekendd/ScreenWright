import { ref } from "vue";

import type { ScreenItem } from "@/model/Visual";

/**
 * 大屏卡片操作按钮的可见性。
 * 开源单机版已彻底取消权限控制（角色/菜单级 + 归属/系统模板判断），
 * 所有操作对所有大屏一律开放。保留此 hook 与 permissionMap 结构，
 * 是因为 templateMenu.vue 仍按 `permissionMap.get(item.id).xxx` 读取。
 */
const ALL_ALLOWED = {
  copy: true,
  modify: true,
  export: true,
  delete: true
} as const;

export const useTemplatePermissionMap = () => {
  const permissionMap = ref(new Map<ScreenItem["id"], typeof ALL_ALLOWED>());

  const setPermissionMap = (screenList: ScreenItem[]) => {
    permissionMap.value = new Map(screenList.map((item) => [item.id, ALL_ALLOWED]));
  };

  return {
    permissionMap,
    setPermissionMap
  };
};
