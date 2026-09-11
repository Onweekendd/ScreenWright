import { shallowRef } from "vue";

import { useActionContext, type UseActionProps } from "./useActionContext";
import { useComponentCreateActions } from "./useComponentCreateActions";
import { useComponentDeleteActions } from "./useComponentDeleteActions";
import { useGroupActions } from "./useGroupActions";
import { useLayerInteractionActions } from "./useLayerInteractionActions";
import { useLayerPersistence } from "./useLayerPersistence";

// 重新导出枚举，保持 API 兼容性
export { UpdateHistoryTypeEnum } from "../utils";

/**
 * 组件操作门面。
 *
 * 对外 API 保持不变，具体职责由领域 hooks 承担；组装顺序同时表达模块依赖，
 * 避免领域 hooks 反向导入 useAction 形成循环依赖。
 */
export const useAction = (props: UseActionProps = { isDynamicPanel: false }) => {
  const context = useActionContext(props);
  const persistence = useLayerPersistence(context);
  const creation = useComponentCreateActions(context, persistence);
  const group = useGroupActions(context, creation, persistence);
  const deletion = useComponentDeleteActions(context, group, persistence);
  const interaction = useLayerInteractionActions(context, persistence);
  const loading = shallowRef(false);

  return {
    buildComponentInstance: creation.buildComponentInstance,
    calculateNewComponentPosition: creation.calculateNewComponentPosition,
    componentList: context.componentList,
    lock: interaction.lock,

    addComponentList: creation.addComponentList,
    addGroupComponentList: creation.addGroupComponentList,
    createNewComponentInstance: creation.createNewComponentInstance,
    getModuleInfoApi: persistence.getModuleInfoApi,
    getNewComponentOptions: creation.getNewComponentOptions,
    handleAsyncOption: interaction.handleAsyncOption,
    handleBottom: interaction.handleBottom,
    handleDelComponent: deletion.handleDelComponent,
    handleGroup: group.handleGroup,
    handleGroupDelete: group.handleGroupDelete,
    handleMoveDown: interaction.handleMoveDown,
    handleMoveUp: interaction.handleMoveUp,
    handleSelectGroupAction: group.handleSelectGroupAction,
    handleSingleLock: interaction.handleSingleLock,
    handleToDynamicPanel: group.handleToDynamicPanel,
    handleTop: interaction.handleTop,
    handleUnGroup: group.handleUnGroup,
    loading,
    saveLayersAggApi: persistence.saveLayersAggApi,
    setComponentShow: interaction.setComponentShow,
    updateComponentLayers: persistence.updateComponentLayers
  };
};
