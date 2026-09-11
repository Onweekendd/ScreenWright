import { defaultNavInfo, type NavInfo, parseIfNeeded } from "@screenwright/core";
import type { LargeScreeInfo, LargeScreenDetailInfo } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { computed, type Ref, toRef } from "vue";

import { useScreenEditor } from "./core-adapter/useScreenEditor";

// NavInfo/defaultNavInfo 直接复用 core（含 detail：大屏详细配置，尺寸/适配/终端通信等，
// 与 app 共享同一份状态，不再各自维护分裂的本地副本）
export type { NavInfo };
export { defaultNavInfo };

// parseIfNeeded 直接复用 core 的纯实现
export { parseIfNeeded };

/**
 * 大屏元信息 composable（适配层）。
 * 返回签名与改造前完全一致：navInfo 仍是可写 ref，
 * `navInfo.value.xxx = y` 等就地修改会直接回写 core 状态。
 */
export const useLargeScreenInfo = createGlobalState(() => {
  const editor = useScreenEditor();
  const screen = editor.screen;

  // toRef 连接到 core 的（Vue reactive）状态：可写、可就地修改、可被替换
  const navInfo = toRef(editor.state.getState(), "navInfo") as unknown as Ref<NavInfo>;
  const isMultiPerson = computed(() => screen.isMultiPerson());

  const setNavInfo = (detailInfo: LargeScreeInfo) => {
    screen.setNavInfo(detailInfo);
  };
  const setVersionCode = (code: string) => screen.setVersionCode(code);
  const resetNavInfo = () => screen.resetNavInfo();

  /** 设置大屏详细配置里的单个字段（就地修改，回写 core 状态）。 */
  const setDetailField = <K extends keyof LargeScreenDetailInfo>(key: K, value: LargeScreenDetailInfo[K]) => {
    screen.setDetailField(key, value);
  };
  /** 重置详细配置为默认值（保留当前 scale）。 */
  const resetDetail = () => screen.resetDetail();

  return { navInfo, isMultiPerson, setNavInfo, setVersionCode, resetNavInfo, setDetailField, resetDetail };
});
