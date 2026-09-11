import { useCommonPanelAction } from "@/views/build/components/buildRender/hooks/useCommonPanelAction";

import { usePanelInfo } from "./usePanelInfo";

const usePanelAction = () => {
  const { panelInfo, activeStatusId, panelData } = usePanelInfo();

  // 复用公共 hooks
  return useCommonPanelAction({
    panelInfo,
    activeStatusId,
    panelData
  });
};

export { usePanelAction };
