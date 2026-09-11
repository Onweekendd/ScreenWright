import type { Ref } from "vue";
import { computed, ref } from "vue";

import type { Condition, TempPool } from "@screenwright/types";
import { ConditionCompareEnum, ConditionTypeEnum } from "@screenwright/types";
import { cloneDeep } from "lodash-es";

import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useDataFilter } from "@/views/build/useDataFilter";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { useCustomEvent } from "../useCustomEvent";

/**
 * 事件类型约束：必须包含 conditions 数组
 */
export type EventWithConditions<T = Record<string, unknown>> = {
  conditions?: Condition[];
} & T;

export const useConditionConfig = <T extends Record<string, unknown>>(eventRef?: Ref<EventWithConditions<T>>) => {
  const { update } = useUpdateInstance();
  const { selectTargetData } = useEditStore();
  const { filterResultForCurrentComponent } = useDataFilter();

  const conditionFields = computed(() => {
    const uniqueKeys = new Set([
      ...Object.keys(filterResultForCurrentComponent.value[0] ?? {}),
      ...(selectTargetData.value[0].dataRemark ?? []).map((item) => item.key)
    ]);
    return [...uniqueKeys].map((key) => ({ value: key }));
  });
  const { currentEvent: defaultCurrentEvent } = useCustomEvent();

  // 使用传入的事件对象或默认的 currentEvent
  const currentEvent = (eventRef as Ref<EventWithConditions<T>>) || defaultCurrentEvent;

  const visible = ref(false);

  // 管理每个条件的展开状态
  const conditionVisibilityMap = ref<Map<string, boolean>>(new Map());

  // 判断类型选项
  const judgeType = ref([
    { label: "满足全部条件", value: "all" },
    { label: "满足任意条件", value: "one" }
  ]);

  // 条件操作按钮
  const conditionCtrl = ref([{ name: "删除", value: "delete", icon: "iconfont-shanchu" }]);

  // 获取条件的展开状态
  const getConditionVisibility = (conditionId: string): boolean | undefined => {
    return conditionVisibilityMap.value.get(conditionId);
  };

  // 关闭抽屉
  const onClose = () => {
    visible.value = false;
  };

  // 添加条件
  const addCondition = () => {
    if (!currentEvent.value.conditions) {
      currentEvent.value.conditions = [];
    }
    const newCondition: Condition = {
      notSaved: true,
      id: String(currentEvent.value.conditions.length + 1),
      name: "条件" + (currentEvent.value.conditions.length + 1),
      type: ConditionTypeEnum.Field,
      code: "",
      compare: ConditionCompareEnum.Include,
      expected: "",
      field: "",
      isExists: false,
      tempPool: {} as TempPool
    };
    currentEvent.value.conditions.push(newCondition);
  };

  // 删除条件
  const onDeleteCondition = (id: string) => {
    if (!currentEvent.value.conditions) {
      return;
    }
    const deleteIndex = currentEvent.value.conditions.findIndex((item) => item.id === id);
    if (deleteIndex === -1) {
      return;
    }

    currentEvent.value.conditions.splice(deleteIndex, 1);
    update();
  };

  // 检查条件是否与快照不同
  const isConditionChanged = (condition: Condition): boolean => {
    // 如果没有快照或快照为空，认为已改变
    if (!condition.tempPool || Object.keys(condition.tempPool).length === 0) {
      return true;
    }

    // 比较所有字段
    return (
      condition.code !== condition.tempPool.code ||
      condition.type !== condition.tempPool.type ||
      condition.field !== condition.tempPool.field ||
      condition.compare !== condition.tempPool.compare ||
      condition.expected !== condition.tempPool.expected
    );
  };

  // 条件类型变化
  const onConditionTypeChange = (index: number) => {
    if (!currentEvent.value.conditions || !currentEvent.value.conditions[index]) {
      return;
    }
    const condition = currentEvent.value.conditions[index];
    condition.notSaved = isConditionChanged(condition);
  };

  /**
   * 设置条件的展开状态
   * @param id 条件 ID
   * @param visible 是否展开
   */
  const onConditionVisibilityChange = (id: string, visible: boolean) => {
    conditionVisibilityMap.value.set(id, visible);
  };

  // 字段条件变化
  const onFieldConditionChange = (index: number) => {
    if (!currentEvent.value.conditions || !currentEvent.value.conditions[index]) {
      return;
    }
    const condition = currentEvent.value.conditions[index];
    condition.notSaved = isConditionChanged(condition);
  };

  // 代码变化
  const onCodeChange = (index: number) => {
    if (!currentEvent.value.conditions || !currentEvent.value.conditions[index]) {
      return;
    }
    const condition = currentEvent.value.conditions[index];
    condition.notSaved = isConditionChanged(condition);
  };

  // 保存条件
  const onSaveCondition = (condition: Condition) => {
    conditionVisibilityMap.value.set(condition.id, false);

    if (!condition.notSaved) {
      return;
    }

    condition.notSaved = false;
    condition.isExists = true;
    condition.tempPool = captureConditionSnapshot(condition);
    update();
  };

  // 取消条件编辑
  const onCancelCondition = (condition: Condition) => {
    conditionVisibilityMap.value.set(condition.id, false);

    if (!condition.notSaved) {
      return;
    }

    condition.notSaved = false;

    if (!condition.isExists) {
      // 新建的条件直接删除
      onDeleteCondition(condition.id);
    } else {
      // 已存在的条件恢复快照
      if (condition.tempPool) {
        Object.assign(condition, cloneDeep(condition.tempPool));
      }
    }
  };

  // 捕获条件快照
  const captureConditionSnapshot = (condition: Condition): TempPool => {
    const { code, type, compare, expected, field, name, isExists } = cloneDeep(condition);
    return {
      name,
      code,
      type,
      field,
      compare,
      expected,
      isExists
    };
  };

  return {
    // 状态
    visible,
    judgeType,
    conditionCtrl,
    currentEvent,
    conditionFields,

    // 操作方法
    getConditionVisibility,
    onClose,
    addCondition,
    onDeleteCondition,
    onSaveCondition,
    onCancelCondition,

    // 变更处理
    onConditionTypeChange,
    onFieldConditionChange,
    onCodeChange,
    onConditionVisibilityChange
  };
};
