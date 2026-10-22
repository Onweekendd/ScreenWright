import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { loadBlueprint } from "@/mastra/services/design-blueprint";

export const readBlueprintTool = createTool({
  id: "read_blueprint",
  description:
    "读回某个大屏的设计蓝图（结构树 + 素材清单 + 每项素材的准备状态和图片 url）。" +
    "组装组件前、上下文被压缩后、或忘了某个节点的位置/素材 url 时调用；节点已按「父在前、同级从下到上」排好，照着顺序建组件即可。",
  inputSchema: z.object({
    screenKey: z.string().describe("大屏目录名，如 screen_29445_1")
  }),
  outputSchema: z.object({
    found: z.boolean(),
    blueprint: z.unknown().optional()
  }),
  execute: async ({ screenKey }) => {
    const blueprint = await loadBlueprint(screenKey);
    return blueprint ? { found: true, blueprint } : { found: false };
  }
});
