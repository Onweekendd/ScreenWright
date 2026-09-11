import { computed, useAttrs } from "vue";

import type { FormItemProps } from "element-plus";

import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

import { useAddKeyboard } from "../../../../../../buildRender/hooks/useAddKeyboard";
import type { AnimationProperty } from "../../type";
import { useStatusAnimation } from "../../useStatusAnimation";

// 进阶表单项的属性接口
export interface StatusSelectorProps extends Partial<FormItemProps> {
  isLocked?: boolean; // 是否锁定状态
  properties: Array<keyof AnimationProperty>;
}

export const useStatusSelector = (props: StatusSelectorProps) => {
  const { KeyboardActiveMap } = useAddKeyboard();
  const {
    editorVisible,
    getRenderTableData,
    addTransitionPropertiesForComponent,
    selectAnimationId,
    selectStatusId,
    componentAnimations
  } = useStatusAnimation();
  const { selectTargetData } = useEditStore();
  const attrs = useAttrs();

  const enableCtrlInteraction = computed(() => {
    if (!editorVisible.value) {
      return false;
    }

    if (!KeyboardActiveMap.value.ctrl) {
      return false;
    }

    if (!getRenderTableData.value.some((item) => `${item.id}` === `${selectTargetData.value[0].id}`)) {
      return false;
    }

    return true;
  });

  // 判断当前组件的属性是否已经在状态动画中被配置
  const isPropertyConfigured = computed(() => {
    if (!editorVisible.value || !selectAnimationId.value || !selectStatusId.value) {
      return false;
    }

    const componentId = `${selectTargetData.value[0].id}`;
    const componentConfig = componentAnimations.value[selectAnimationId.value]?.[selectStatusId.value]?.[componentId];

    if (!componentConfig) {
      return false;
    }

    // 检查props.properties中的属性是否在组件配置中存在
    return props.properties.some((property) => componentConfig[property] !== undefined);
  });

  // 获取已配置的属性列表
  const configuredProperties = computed(() => {
    if (!editorVisible.value || !selectAnimationId.value || !selectStatusId.value) {
      return [];
    }

    const componentId = `${selectTargetData.value[0].id}`;
    const componentConfig = componentAnimations.value[selectAnimationId.value]?.[selectStatusId.value]?.[componentId];

    if (!componentConfig) {
      return [];
    }

    // 返回已配置的属性列表
    return props.properties.filter((property) => componentConfig[property] !== undefined);
  });

  // 计算传递给 el-form-item 的属性
  const formItemProps = computed(() => {
    const { isLocked: _isLocked, ...elFormItemProps } = props;
    return {
      ...elFormItemProps,
      ...attrs
    };
  });

  // 计算组件的class
  const computedClass = computed(() => {
    const classes: Record<string, boolean> = {};

    if (enableCtrlInteraction.value && !props.isLocked) {
      classes["advanced-form-item"] = true;
      classes["cursor-ctrl-hover"] = true;
      classes["ctrl-active"] = KeyboardActiveMap.value.ctrl;
    }

    // 添加锁定状态的class
    if (props.isLocked) {
      classes["locked"] = true;
    }

    return classes;
  });

  // 处理点击事件
  const handleClick = async (e: MouseEvent) => {
    // 如果是锁定状态，不处理任何点击
    if (props.isLocked) {
      return;
    }

    // 如果按下了Ctrl键且启用了Ctrl交互
    if (enableCtrlInteraction.value) {
      e.preventDefault();
      e.stopPropagation();

      await addTransitionPropertiesForComponent(`${selectTargetData.value[0].id}`, props.properties);

      return;
    }
  };

  return {
    formItemProps,
    computedClass,
    handleClick,
    isPropertyConfigured,
    configuredProperties
  };
};
