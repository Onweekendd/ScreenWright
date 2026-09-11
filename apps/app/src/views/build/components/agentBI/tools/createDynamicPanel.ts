import { createTool } from "@mastra/client-js";

import { NavigationActionType, useNavListStrategies } from "@/views/build/useNavListStrategies";

export const createDynamicPanelTool = createTool({
  id: "create-dynamic-panel",
  description: "创建动态面板",
  execute: async () => {
    const { allNavigationStrategies } = useNavListStrategies();

    const createDynamicPanelStrategy = allNavigationStrategies[NavigationActionType.DYNAMIC_PANEL];

    if (!createDynamicPanelStrategy) {
      return;
    }

    await createDynamicPanelStrategy();
  }
});
