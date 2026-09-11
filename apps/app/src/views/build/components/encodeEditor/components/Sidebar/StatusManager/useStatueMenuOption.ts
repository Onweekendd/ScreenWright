import { computed } from "vue";

import { ElMessage } from "element-plus";

import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { MenuOptionsItemType } from "@/views/build/components/buildRender/type";
import { useEncodePanelAction } from "@/views/build/components/encodeEditor/useEncodePanelAction";
import { useEncodePanelInfo } from "@/views/build/components/encodeEditor/useEncodePanelInfo";

export enum StatusMenuType {
  COPY_STATUS = "copyStatus",
  DELETE_STATUS = "deleteStatus"
}

export type StatusMenuOptionsItemType = Omit<MenuOptionsItemType, "key"> & { key: StatusMenuType };

export const useStatusMenuOptions = () => {
  const { onStatusCopy, onStatusDelete } = useEncodePanelAction();
  const { panelInfo } = useEncodePanelInfo();
  const defaultOptions = computed(
    () =>
      [
        {
          label: "复制状态",
          key: StatusMenuType.COPY_STATUS,
          icon: "DocumentCopy",
          fnHandle: (status: PanelState) => {
            onStatusCopy(status);
          }
        },
        {
          label: "删除状态",
          key: StatusMenuType.DELETE_STATUS,
          icon: "Document",
          fnHandle: (status: PanelState) => {
            if (!panelInfo.value.config.panelData) {
              console.error("panelData is not defined");
              return;
            }

            if (panelInfo.value.config.panelData.length === 1) {
              ElMessage.warning("提示：终端交互面板状态不能为空!");
              return;
            }

            onStatusDelete(status);
          }
        }
      ] as StatusMenuOptionsItemType[]
  );
  return { defaultOptions };
};
