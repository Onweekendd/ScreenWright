import { useCommonMenuOption } from "@/views/build/components/buildRender/hooks/useCommonMenuOption";

import { usePanelInfo } from "../../usePanelInfo";

export const usePanelMenuOption = () => {
  const { panelInfo, activeStatusId, panelData } = usePanelInfo();
  const { commonMenuOptions } = useCommonMenuOption({ panelInfo, activeStatusId, panelData });

  return {
    panelDefaultOptions: commonMenuOptions
  };
};
