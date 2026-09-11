import { useCommonMenuOption } from "@/views/build/components/buildRender/hooks/useCommonMenuOption";
import { useEncodePanelInfo } from "@/views/build/components/encodeEditor/useEncodePanelInfo";

export const useEncodePanelMenuOption = () => {
  const { panelInfo, activeStatusId, panelData } = useEncodePanelInfo();
  const { commonMenuOptions } = useCommonMenuOption({ panelInfo, activeStatusId, panelData });

  return {
    encodePanelDefaultOptions: commonMenuOptions
  };
};
