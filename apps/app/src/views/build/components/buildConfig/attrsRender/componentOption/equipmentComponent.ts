import { editor as MaterialEquipmentEditor } from "@screenwright/material/equipment";

import type { SingleOption } from "./ComponentOptions";

// 物联组件（Equipment）已全部物料化（渲染 + 配置面板均在 @screenwright/material），无 app 保留项，
// 此处纯转发 material 的 editor，保持 componentOption/index.ts 聚合零改动。
export const equipmentEnumComponentOptions = MaterialEquipmentEditor as Record<string, SingleOption[]>;
