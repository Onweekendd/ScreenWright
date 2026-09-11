import type { ComponentType } from "@screenwright/types";

import { UpdateHistoryTypeEnum } from "@/views/build/components/buildRender/hooks/useAction";

import { useCommandHistory } from "./command/useCommandHistory";
import { useHistoryData } from "./command/useHistoryData";
import { useAlignmentWasm } from "./components/buildRender/hooks/useAlignmentWasm";
import { useTabsMenuGroup } from "./useTabsMenuGroup";

/**
 * 从删除URL中提取组件ID
 * @param url 删除接口URL
 * @returns 提取的ID，如果提取失败返回null
 */
export const extractIdFromDeleteUrl = (url: string): number | null => {
  const urlParts = url.split("/");
  const id = parseInt(urlParts[urlParts.length - 1]);

  if (isNaN(id)) {
    console.warn("无法从删除URL中提取有效ID:", url);
    return null;
  }

  return id;
};

/**
 * 从响应配置中解析更新的组件数据
 * @param responseData 响应配置数据
 * @returns 解析后的组件对象
 */
export const parseUpdateComponent = (responseData: string): ComponentType => {
  const configData = JSON.parse(responseData);
  return JSON.parse(configData.config) as ComponentType;
};

/**
 * 查找组件对应的模块ID
 * @param componentTitle 组件标题
 * @returns 模块ID，如果未找到返回undefined
 */
const findModuleIdByComponentTitle = (componentTitle: string, tabsList: Array<{ name: string; id: number }>) => {
  return tabsList.find((item) => item.name === componentTitle)?.id;
};

/**
 * 响应历史记录处理 hooks
 *
 * 负责将 API 响应转换为撤销重做命令
 *
 * @example
 * ```typescript
 * const {
 *   handleDeleteResponse,
 *   handleUpdateResponse
 * } = useResponseHistoryHandler();
 *
 * // 在响应拦截器中使用
 * handleDeleteResponse(url, updateHistoryType);
 * handleUpdateResponse(responseData, updateHistoryType);
 * ```
 */
export const useResponseHistoryHandler = () => {
  const { cacheComponentList, updateCacheComponent } = useHistoryData();
  const { batchCreateDeleteComponentsCommand, batchCreateUpdateComponentsCommand, createAddComponentCommand } =
    useCommandHistory();
  const { tabsList } = useTabsMenuGroup();
  const {
    updateNode: updateNodeInAlignmentWasm,
    addNode: addNodeInAlignmentWasm,
    removeNode: removeNodeInAlignmentWasm
  } = useAlignmentWasm();

  /**
   * 处理删除操作的响应
   * @param url 请求URL
   * @param updateHistoryType 历史更新类型
   */
  const handleDeleteResponse = (url: string, updateHistoryType: UpdateHistoryTypeEnum) => {
    // 跳过历史记录
    if (updateHistoryType === UpdateHistoryTypeEnum.SKIP) {
      return;
    }

    // 提取组件ID
    const id = extractIdFromDeleteUrl(url);
    if (id === null) {
      return;
    }

    // 从缓存中获取组件
    const deleteComponent = cacheComponentList.value?.get(`${id}`);
    if (!deleteComponent) {
      return;
    }

    // 查找模块ID
    const moduleId = findModuleIdByComponentTitle(deleteComponent.title, tabsList.value);
    if (!moduleId) {
      return;
    }

    console.log("检测到删除操作", { componentId: id, moduleId, url });

    // 从对齐 wasm 中移除节点
    removeNodeInAlignmentWasm(deleteComponent);

    // 添加到批量删除命令
    batchCreateDeleteComponentsCommand.addDelete({ component: deleteComponent, moduleId });
  };

  /**
   * 处理更新操作的响应
   * @param responseData 响应配置数据
   * @param updateHistoryType 历史更新类型
   */
  const handleUpdateResponse = (responseData: string, updateHistoryType: UpdateHistoryTypeEnum) => {
    // 解析组件数据
    const updateComponent = parseUpdateComponent(responseData);

    // 新增操作
    if (updateHistoryType === UpdateHistoryTypeEnum.ADD) {
      const moduleId = findModuleIdByComponentTitle(updateComponent.title, tabsList.value);
      if (!moduleId) {
        return;
      }

      // 添加到对齐 wasm
      addNodeInAlignmentWasm(updateComponent);

      // 创建添加命令
      createAddComponentCommand(updateComponent, moduleId);
    } else {
      // 更新或跳过操作，需要先找到旧组件
      const oldComponent = cacheComponentList.value?.get(updateComponent.id.toString());
      if (!oldComponent) {
        return;
      }

      // 更新对齐 wasm 中的节点
      updateNodeInAlignmentWasm(oldComponent, updateComponent);

      // 更新操作 - 添加到批量更新命令
      if (updateHistoryType === UpdateHistoryTypeEnum.UPDATE) {
        batchCreateUpdateComponentsCommand.addUpdate(updateComponent);
      } else if (updateHistoryType === UpdateHistoryTypeEnum.SKIP) {
        // 跳过历史记录，只更新缓存
        updateCacheComponent(updateComponent);
      }
    }
  };

  const handleCopyResponse = (responseData: string, updateHistoryType: UpdateHistoryTypeEnum) => {
    // 解析组件数据
    const updateComponent = JSON.parse(responseData);

    // 新增操作
    if (updateHistoryType === UpdateHistoryTypeEnum.ADD) {
      const moduleId = findModuleIdByComponentTitle(updateComponent.title, tabsList.value);
      if (!moduleId) {
        return;
      }

      // 添加到对齐 wasm
      addNodeInAlignmentWasm(updateComponent);

      // 创建添加命令
      createAddComponentCommand(updateComponent, moduleId);
    } else {
      updateCacheComponent(updateComponent);
    }
  };

  return {
    handleDeleteResponse,
    handleUpdateResponse,
    handleCopyResponse
  };
};
