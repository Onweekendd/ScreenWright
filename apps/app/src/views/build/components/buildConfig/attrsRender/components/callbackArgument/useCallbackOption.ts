import { computed, ref } from "vue";

import { debounce } from "lodash-es";

import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { templateCallback } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/options";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";
import type { Callback } from "@/views/build/components/buildRender/type";

import { ueMessageTypeOptions } from "../../../constants";

/**
 * 回调参数配置Hook
 * @returns {Object} 回调参数配置相关的状态和方法
 */
export const useCallbackOption = () => {
  // 状态定义
  /** 当前选中的回调配置 */
  const currentCallback = ref<Callback | null>(null);

  /** 空列表提示信息 */
  const defaultMgs = ref<string>("列表为空");

  /** 当前选中的标签页ID */
  const activeTab = ref("");
  /** 记录上一次的目标变量值 */
  const lastTargetValue = ref("");
  const { update, selectTargetData } = useUpdateInstance();
  const { callbackArgumentsManager, initCallbackRelation, emitAddCallbackField, emitRemoveCallbackField } =
    useCallbackArguments();

  /**
   * 计算原始查询数据，用于字段选择器
   * @returns {Array} 格式化后的查询数据列表
   */
  const originQueryData = computed(() => {
    if (selectTargetData.value.length > 0 && selectTargetData.value[0].dataRemark) {
      return selectTargetData.value[0].dataRemark.map((item) => {
        return {
          value: item.key
        };
      });
    }

    return [];
  });

  /**
   * 计算回调选项列表
   * @returns {Array} 回调参数列表
   */
  const callbackOptions = computed(() => {
    return selectTargetData.value[0].cbArgs || [];
  });

  /**
   * 根据ID更新当前选中的回调选项
   */
  const updateCurrentCallback = (targetTabId: string) => {
    activeTab.value = targetTabId;

    if (!selectTargetData.value[0]?.cbArgs) {
      currentCallback.value = null;
      return;
    }

    const callBack = selectTargetData.value[0].cbArgs.find((cb) => cb.id === activeTab.value);
    if (!callBack) {
      currentCallback.value = null;
      return;
    }

    currentCallback.value = callBack;
    // 更新当前值记录
    lastTargetValue.value = callBack.value?.target?.value || "";
  };

  /**
   * 同步激活项状态 - 在cbArgs改变时调用
   * 尝试保持当前激活项不变，如果不存在则选择第一个
   */
  const syncActiveState = () => {
    const cbArgs = selectTargetData.value[0]?.cbArgs;

    if (!cbArgs || cbArgs.length === 0) {
      activeTab.value = "";
      currentCallback.value = null;
      return;
    }

    // 如果当前有激活项，检查是否仍然存在
    if (activeTab.value) {
      const currentCallbackStillExists = cbArgs.find((cb) => cb.id === activeTab.value);
      if (currentCallbackStillExists) {
        // 当前激活项仍然存在，更新当前回调数据
        updateCurrentCallback(activeTab.value);
      } else {
        // 当前激活项不存在了，选择第一个作为激活项
        activeTab.value = cbArgs[0].id;
        updateCurrentCallback(activeTab.value);
      }
    } else {
      // 没有激活项，选择第一个作为激活项
      activeTab.value = cbArgs[0].id;
      updateCurrentCallback(activeTab.value);
    }
  };

  /**
   * 添加新的回调参数
   */
  const addCallback = () => {
    // 如果有未初始化的回调参数，先移除
    if (
      selectTargetData.value[0].cbArgs &&
      selectTargetData.value[0].cbArgs.length &&
      !selectTargetData.value[0].cbArgs[0].id
    ) {
      selectTargetData.value[0].cbArgs.splice(0, 1);
    }

    // 创建新回调参数
    const tempCallback = templateCallback();

    // 添加到列表中
    if (selectTargetData.value[0].cbArgs) {
      selectTargetData.value[0].cbArgs.push(tempCallback);
    } else {
      selectTargetData.value[0]["cbArgs"] = [tempCallback];
    }

    // 更新选中标签和实例
    activeTab.value = tempCallback.id;
    update();
    updateCurrentCallback(activeTab.value);
  };

  /**
   * 删除当前选中的回调参数
   */
  const deleteCallback = async () => {
    if (!currentCallback.value || !currentCallback.value.id || !selectTargetData.value[0].cbArgs) return;

    // 删除回调关系
    if (currentCallback.value.value && currentCallback.value.value.target && currentCallback.value.value.target.value) {
      const targetKey = currentCallback.value.value.target.value;
      const relation = callbackArgumentsManager.value[targetKey];

      if (relation && relation.source) {
        // 从source数组中过滤掉当前回调
        relation.source = relation.source.filter(
          (source) => !(source.id === selectTargetData.value[0].id && source.cbId === currentCallback.value!.id)
        );
      }
    }

    const toDeleteId = currentCallback.value.id;
    const delIndex = selectTargetData.value[0].cbArgs.findIndex((item) => item.id === toDeleteId);
    const prevIndex = delIndex > 0 ? delIndex - 1 : 0;

    // 从列表中移除
    selectTargetData.value[0].cbArgs.splice(delIndex, 1);

    // 更新选中标签
    if (selectTargetData.value[0].cbArgs.length) {
      activeTab.value = selectTargetData.value[0].cbArgs[prevIndex].id;
    } else {
      activeTab.value = "";
    }

    await processCallbackRelations(lastTargetValue.value, "");

    update();
    updateCurrentCallback(activeTab.value);
  };

  /**
   * 初始化回调参数数据
   */
  const initializeCallbackData = () => {
    // 使用统一的同步方法来处理初始化
    syncActiveState();
  };

  /**
   * 更新回调参数关系（原始函数）
   * @param {string} newTargetKey - 新的目标变量名
   */
  const _updateCallbackArgument = async (newTargetKey?: string) => {
    if (!currentCallback.value) {
      return;
    }

    // 获取旧的目标值
    const oldTargetKey = lastTargetValue.value;

    if (oldTargetKey === newTargetKey) {
      return;
    }

    // 更新当前值（如果需要）
    if (newTargetKey !== undefined && currentCallback.value.value) {
      currentCallback.value.value.target.value = newTargetKey;
      update();
    }

    // 使用传入的新值，或者从当前回调中获取
    const targetKey = newTargetKey || currentCallback.value.value.target.value;

    // 更新lastTargetValue以便下次使用
    lastTargetValue.value = targetKey;

    // 处理回调参数关系
    await processCallbackRelations(oldTargetKey, targetKey);
  };

  /**
   * 处理回调关系
   * @param {string} oldTargetKey - 旧的目标变量名
   * @param {string} newTargetKey - 新的目标变量名
   */
  const processCallbackRelations = async (oldTargetKey: string, newTargetKey: string) => {
    // 如果有旧值且不为空，则移除旧关系
    if (oldTargetKey && oldTargetKey.trim() !== "") {
      await removeCallbackRelation(oldTargetKey);
    }

    // 如果有新值且不为空，则添加新关系
    if (newTargetKey && newTargetKey.trim() !== "") {
      addCallbackRelation(newTargetKey);
    }
  };

  /**
   * 移除回调关系
   * @param {string} targetKey - 目标变量名
   */
  const removeCallbackRelation = async (targetKey: string) => {
    const oldRelation = callbackArgumentsManager.value[targetKey];
    if (oldRelation && oldRelation.source) {
      // 从source数组中过滤掉当前回调
      oldRelation.source = oldRelation.source.filter(
        (source) => !(source.id === selectTargetData.value[0].id && source.cbId === currentCallback.value!.id)
      );

      // 如果source为空且target为空，可以考虑删除整个关系
      if (oldRelation.source.length === 0 && (!oldRelation.target || oldRelation.target.length === 0)) {
        delete callbackArgumentsManager.value[targetKey];
      }

      // 为每个target触发事件
      if (oldRelation.target && oldRelation.target.length > 0) {
        for (const target of oldRelation.target) {
          // 确保id是数字类型
          const targetId = typeof target.id === "string" ? parseInt(target.id) : target.id;
          if (!isNaN(targetId)) {
            await emitRemoveCallbackField(targetId, targetKey);
          }
        }
      }
    }
  };

  /**
   * 添加回调关系
   * @param {string} targetKey - 目标变量名
   */
  const addCallbackRelation = (targetKey: string) => {
    // 添加新关系
    const relation = callbackArgumentsManager.value[targetKey];
    if (relation) {
      // 检查是否已存在相同的source，避免重复添加
      const existingSource = relation.source.find(
        (source) => source.id === selectTargetData.value[0].id && source.cbId === currentCallback.value!.id
      );

      if (!existingSource) {
        relation.source.push({
          id: selectTargetData.value[0].id,
          name: selectTargetData.value[0].name,
          cbId: currentCallback.value!.id
        });
      }

      // 为每个target触发事件
      if (relation.target && relation.target.length > 0) {
        relation.target.forEach((target) => {
          // 确保id是数字类型
          const targetId = typeof target.id === "string" ? parseInt(target.id) : target.id;
          if (!isNaN(targetId)) {
            emitAddCallbackField(targetId, targetKey);
          }
        });
      }
    } else {
      initCallbackRelation(targetKey);

      const newRelation = callbackArgumentsManager.value[targetKey];
      newRelation!.source.push({
        id: selectTargetData.value[0].id,
        name: selectTargetData.value[0].name,
        cbId: currentCallback.value!.id
      });

      // 初始状态可能没有target，不需要触发事件
    }
  };

  /**
   * 防抖处理的回调参数关系更新函数
   * @param {string} newTargetKey - 新的目标变量名
   */
  const updateCallbackArgument = debounce(_updateCallbackArgument, 100);

  /**
   * 更新当前组件所有cbArgs的关系
   * 用于撤销操作时重新建立所有回调参数的关系
   *
   * 使用场景：
   * - 撤销/重做操作后，需要重新建立所有回调参数关系
   * - 组件数据恢复后，需要同步回调参数状态
   *
   * 调用方式：
   * ```typescript
   * // 在撤销操作后调用
   * updateAllCallbackArguments()
   * ```
   */
  const updateAllCallbackArguments = (oldCbArgs?: Callback[]) => {
    const cbArgs = selectTargetData.value[0]?.cbArgs;

    if (!cbArgs || cbArgs.length === 0) {
      console.log("当前组件没有回调参数，跳过更新");
      return;
    }

    oldCbArgs?.forEach((oldCallback) => {
      if (oldCallback.value && oldCallback.value.target && oldCallback.value.target.value) {
        const oldTargetKey = oldCallback.value.target.value.trim();
        removeCallbackRelation(oldTargetKey);
      }
    });

    // 遍历所有回调参数，重新建立关系
    cbArgs.forEach((callback) => {
      if (callback.value && callback.value.target && callback.value.target.value) {
        const targetKey = callback.value.target.value.trim();

        addCallbackRelation(targetKey);
      }
    });
  };

  return {
    // 状态
    currentCallback,
    defaultMgs,
    activeTab,
    originQueryData,
    callbackOptions,
    ueMessageTypeOptions,

    // 方法
    addCallback,
    deleteCallback,
    updateCurrentCallback,
    syncActiveState,
    update,
    updateCallbackArgument,
    _updateCallbackArgument,
    init: initializeCallbackData,
    updateAllCallbackArguments
  };
};
