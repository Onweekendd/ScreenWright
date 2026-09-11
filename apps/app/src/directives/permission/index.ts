import { type Directive } from "vue";

/**
 * 权限指令（v-permission）。
 * 开源单机版已取消角色/菜单级权限控制，此指令保留为空实现：
 * 始终保留绑定元素，不做任何 DOM 移除。注册入口 directives/index.ts 仍引用它。
 */
export const permission: Directive = {
  mounted() {
    /* no-op：不再按菜单权限移除元素 */
  }
};
