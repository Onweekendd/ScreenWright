import { computed } from "vue";

import { ElMessage } from "element-plus";

import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { MenuOptionsItemType } from "@/views/build/components/buildRender/type";
import { usePanelAction } from "@/views/build/components/panelEditor/usePanelAction";
import { usePanelInfo } from "@/views/build/components/panelEditor/usePanelInfo";

export enum StatusMenuType {
  COPY_STATUS = "copyStatus",
  DELETE_STATUS = "deleteStatus"
}

export type StatusMenuOptionsItemType = Omit<MenuOptionsItemType, "key"> & { key: StatusMenuType };

export const useStatusMenuOptions = () => {
  const { panelInfo } = usePanelInfo();
  const { onStatusCopy, onStatusDelete } = usePanelAction();
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
              ElMessage.warning("提示：动态面板状态不能为空!");
              return;
            }

            onStatusDelete(status);
          }
        }
      ] as StatusMenuOptionsItemType[]
  );
  return { defaultOptions };
};
