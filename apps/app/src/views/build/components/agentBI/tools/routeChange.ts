import { until } from "@vueuse/core";

import { createTool } from "@mastra/client-js";
import z from "zod";

import router from "@/router";
import { usePanelData } from "@/views/build/components/panelEditor/usePanelData";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { createJsonSchema } from "./util";

const routeChangeInputSchema = z.object({
  targetType: z.enum(["root", "encode", "panel"]).describe("跳转目标类型 root:大屏首页;panel:动态面板;encode:终端面板"),
  targetId: z.number().optional().describe("跳转目标ID,只有在targetType为panel或encode时才需要提供")
});

export const routeChange = createTool({
  id: "routeChange",
  description:
    "用于前端路由跳转。支持三种跳转目标：root（大屏首页，无需 targetId）、panel（动态面板，需提供 targetId）、encode（终端面板，需提供 targetId）。",
  inputSchema: createJsonSchema(routeChangeInputSchema),
  execute: async (rawArgs) => {
    const { targetType, targetId } = rawArgs as unknown as z.infer<typeof routeChangeInputSchema>;
    console.log("routeChange tool execute", { targetType, targetId });
    const { navInfo } = useLargeScreenInfo();

    if ((targetType === "panel" || targetType === "encode") && targetId === undefined) {
      return { success: false, error: `${targetType} 跳转必须提供 targetId` };
    }

    switch (targetType) {
      case "root": {
        const { isLoad: isScreenLoad } = useInitLargeScreenData();
        isScreenLoad.value = false;
        await router.push(`/build/${navInfo.value.id}`);
        await until(isScreenLoad).toBe(true);
        break;
      }
      case "panel": {
        const { isLoad: isPanelLoad, setIsLoad: setPanelLoad } = usePanelData();
        setPanelLoad(false);
        await router.push({ name: "panel", params: { id: navInfo.value.id, cid: targetId } });
        await until(isPanelLoad).toBe(true);
        break;
      }
      case "encode": {
        const { isLoad: isPanelLoad, setIsLoad: setPanelLoad } = usePanelData();
        setPanelLoad(false);
        await router.push({ name: "encode", params: { id: navInfo.value.id, cid: targetId } });
        await until(isPanelLoad).toBe(true);
        break;
      }
    }

    return { success: true, targetType, targetId };
  }
});
