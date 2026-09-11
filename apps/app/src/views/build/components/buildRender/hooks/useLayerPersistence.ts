import { getModuleInfo, saveLayersAgg } from "@/api/library";
import to from "@/utils/await-to-js";

import { PanelType } from "../core/SystemComponent/type";
import type { ComponentType } from "../type";
import { saveLayersByType, UpdateHistoryTypeEnum } from "../utils";
import type { ActionContext } from "./useActionContext";

export const useLayerPersistence = ({ cIsDynamicPanel, navInfo }: ActionContext) => {
  const saveLayersAggApi = async (
    data: Record<string, unknown>,
    options?: {
      showLoading?: boolean;
      updateHistoryType?: UpdateHistoryTypeEnum;
    }
  ) => {
    const dataParams = {
      ...data,
      largeId: navInfo.value.id,
      moduleId: data.moduleId || 75,
      isSaved: 1
    };
    const [error, res] = await to(
      saveLayersAgg(dataParams as Parameters<typeof saveLayersAgg>[0], options?.showLoading, options?.updateHistoryType)
    );
    if (error) {
      return null;
    }
    if (res && res.success) {
      return res.result;
    }
    return null;
  };

  const getModuleInfoApi = async (id: string) => {
    const [error, res] = await to(getModuleInfo(id));
    if (error) {
      return null;
    }
    if (res && res.success) {
      return res.result;
    }
    return null;
  };

  const normalizeQuotePanel = (component: ComponentType) => {
    if (component.component.prop !== PanelType.quotePanel) {
      return component;
    }

    return {
      ...component,
      panelData: component.panelData.map((panel: Record<string, unknown>) => {
        delete panel.config;
        return panel;
      })
    } as ComponentType;
  };

  const updateComponentLayers = async (
    component: ComponentType,
    {
      fullUpdateDynamicPanel,
      fullUpdateGroup,
      status,
      showLoading,
      syncWorkspace,
      updateHistoryType
    }: {
      fullUpdateGroup?: boolean;
      fullUpdateDynamicPanel?: boolean;
      updateHistoryType?: UpdateHistoryTypeEnum;
      showLoading?: boolean;
      status?: boolean;
      /** false 表示本次改动不回写 agent 工作区（后端推来的更新走这条，见 saveLayersByType） */
      syncWorkspace?: boolean;
    } = {
      fullUpdateDynamicPanel: false,
      fullUpdateGroup: true,
      showLoading: false,
      updateHistoryType: UpdateHistoryTypeEnum.UPDATE
    }
  ) => {
    const targetComponent = normalizeQuotePanel(component);
    return await saveLayersByType(targetComponent, status ?? cIsDynamicPanel.value, {
      fullUpdateDynamicPanel,
      fullUpdateGroup,
      showLoading,
      syncWorkspace,
      updateHistoryType: updateHistoryType ?? UpdateHistoryTypeEnum.UPDATE
    });
  };

  return {
    getModuleInfoApi,
    saveLayersAggApi,
    updateComponentLayers
  };
};

export type LayerPersistence = ReturnType<typeof useLayerPersistence>;
