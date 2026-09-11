import { useCommonPanelAction } from "@/views/build/components/buildRender/hooks/useCommonPanelAction";

import { useEncodePanelInfo } from "./useEncodePanelInfo";

const useEncodePanelAction = () => {
  const { panelInfo, activeStatusId, panelData } = useEncodePanelInfo();

  // 复用公共 hooks
  return useCommonPanelAction({
    panelInfo,
    activeStatusId,
    panelData
  });
};

export { useEncodePanelAction };
