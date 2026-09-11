import { editor as MaterialExtendsEditor } from "@screenwright/material/extends";

import type { SingleOption } from "./ComponentOptions";

// 扩展组件配置面板全部来自已物料化的 @screenwright/material/extends
// （UE 串流 / 数字人配置面板已随组件一起移除）。
export const extendsComponentOptions: Record<string, SingleOption[]> = {
  ...(MaterialExtendsEditor as Record<string, SingleOption[]>)
};
