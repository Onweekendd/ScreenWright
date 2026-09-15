<!-- 单选框 -->
<template>
  <div
    :class="{
      'ft-singleSelectedLegend': true,
      'component-bind-events': true,
      'has-bind': events?.length && isBuild.value,
      'has-encode': encodes?.length && isBuild.value
    }"
    ref="ftSingleSelectedLegendRef"
  >
    <el-tree
      ref="contentRef"
      :data="currentData"
      :props="defaultProps"
      node-key="label"
      :default-checked-keys="legendCheckedList"
      @check="changeValue"
      show-checkbox
      :style="backgroundStyles"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import type { ElTree } from "element-plus";
import { cloneDeep } from "lodash-es";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "ftSingleSelectedLegend"
});
const props = defineProps<{
  element: ComponentType;
}>();

// 使用基础数据hook
const { option, dataChart, events, encodes, isBuild, handleEventAndCallbackEvent } = useBaseData(props.element);
const { addEvent } = useActionEvent();
console.log(dataChart.value, "fff");
// 响应式引用
const ftSingleSelectedLegendRef = ref<HTMLElement | null>(null);

const contentRef = ref<InstanceType<typeof ElTree> | null>(null);
const legendCheckedList = ref<string[]>([]);
const isFirstInit = ref(true);
const currentData = ref<any[]>([]);
// 属性
const defaultProps = reactive({
  label: "label",
  children: "noneOfChildren" // 单选框没有children
});
const backgroundStyles = computed(() => {
  if (!option.value) return {};
  if (option.value.backgroundBackgroundType === "color") {
    return {
      backgroundColor: option.value.backgroundBackgroundColor,
      backgroundImage: "none"
    };
  } else {
    return {
      backgroundColor: "transparent",
      backgroundImage: `url(${setMinioUrl(option.value.backgroundBackgroundImage)})`
    };
  }
});
// 初始化样式
const init = () => {
  const legendDom = ftSingleSelectedLegendRef.value;
  if (!legendDom || !option.value) return;

  const regList = ["fontSize", "radius", "letterSpacing", "width", "height", "position", "padding"];
  for (const [key, value] of Object.entries(option.value)) {
    let style = value as string;
    // 字段包含fontSize或radius或letterSpacing则+px
    for (let index = 0; index < regList.length; index++) {
      const reg = new RegExp(regList[index], "i");
      if (reg.test(key)) {
        style += "px";
        break;
      }
    }
    legendDom.style.setProperty(`--${key}`, style);
    currentData.value = cloneDeep(dataChart.value);
  }
};

// 勾选
const changeValue = async (data: any) => {
  await nextTick();
  if (legendCheckedList.value.includes(data.label)) {
    legendCheckedList.value = [];
    contentRef.value && contentRef.value.setCheckedKeys([], false);
  } else {
    legendCheckedList.value = [data.label];
    contentRef.value && contentRef.value.setCheckedKeys([data.label], false);
  }
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: {
      ...data,
      isChecked: true
    }
  });
};

// 点击处理函数（供外部调用）
const handleClick = (info: any) => {
  if (info && info.label) {
    // 构造一个模拟的 checkedData 对象

    changeValue(info);
  }
};

// 监听数据变化
watch(
  () => currentData.value,
  (val) => {
    if (val && val.length > 0) {
      // 初始化触发一次各选项交互
      if (isFirstInit.value) {
        // 特殊处理：初始化时默认不触发事件动作类型为通信的事件动作
        // val.forEach((item: any) => handleClick(item, false, true))
        isFirstInit.value = false;
      }
      legendCheckedList.value = [];
      val.forEach((item: any) => {
        if (typeof item.isChecked == "string") {
          item.isChecked = item.isChecked.toLowerCase();
          item.isChecked = item.isChecked == "true";
        }
        if (item.isChecked) {
          legendCheckedList.value.push(item.label);
        }
      });
    }
  },
  { deep: true }
);
// dataChart.value
watch(
  () => dataChart.value,
  () => {
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: dataChart.value[0] || {}
    });
    currentData.value = cloneDeep(dataChart.value);
  },
  { immediate: true }
);
// 监听选项变化
watch(
  () => option.value,
  (val) => {
    nextTick(() => {
      console.log(val);
      init();
    });
  },
  { deep: true, immediate: true }
);

// 生命周期
onMounted(() => {
  // 注册组件事件到全局事件系统
  addEvent({
    [`${interactiveEnum.SwSingleSelectedLegend}-${props.element.id}`]: {
      handleClick
    }
  });
});
</script>

<style lang="scss" scoped>
.ft-singleSelectedLegend {
  :deep(.el-tree) {
    // background-color: var(--backgroundBackgroundColor) !important;
    border-radius: var(--backgroundBorderRadius);
    border: solid 1px var(--backgroundBorderColor);
    padding: 13px 22px 15px 15px;
    // pointer-events: all;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    overflow: auto;
    height: 100%;
    box-sizing: border-box;
  }
  :deep(.el-tree-node:focus > .el-tree-node__content),
  :deep(.el-tree-node__content:hover) {
    background-color: transparent;
  }
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
  :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
    background: var(--checkboxBackgroundColorIsChecked) !important;
    border-color: var(--checkboxBorderColorIsChecked) !important;
  }
  :deep(.el-checkbox__inner) {
    background: var(--checkboxBackgroundColor) !important;
    border-color: var(--checkboxBorderColor) !important;
    z-index: 0 !important;
  }
  :deep(.el-checkbox__inner::after) {
    width: calc(var(--checkboxWidth) / 4);
    height: calc(var(--checkboxHeight) / 2);
    // 垂直居中：top = (复选框高度 - 钩子高度) / 2 = sizeY / 4
    top: calc(50% - var(--checkboxWidth) / 20);
    // 水平居中：left = (复选框宽度 - 钩子宽度) / 2 = sizeX * 3 / 8
    left: calc(var(--checkboxHeight) * 3.5 / 8);

    border: 1.4px solid var(--checkboxCheckColor);
    border-left: 0;
    border-top: 0;
  }
  :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner::before) {
    background-color: var(--checkboxBackgroundColor) !important;
  }
  :deep(.el-tree-node__label) {
    font-family: var(--labelFontFamily);
    font-size: var(--labelFontSize) !important;
    color: var(--labelColor);
    font-style: var(--labelFontStyle);
    font-weight: var(--labelFontWeight);
    letter-spacing: var(--labelLetterSpacing);
  }
  :deep(.is-checked .el-tree-node__label) {
    font-family: var(--labelFontFamilyIsChecked);
    font-size: var(--labelFontSizeIsChecked) !important;
    color: var(--labelColorIsChecked);
    font-style: var(--labelFontStyleIsChecked);
    font-weight: var(--labelFontWeightIsChecked);
    letter-spacing: var(--labelLetterSpacingIsChecked);
  }
  :deep(.el-checkbox__inner) {
    width: var(--checkboxWidth);
    height: var(--checkboxHeight);
  }
  :deep(.el-tree-node__content) {
    padding: var(--checkboxPaddingTop) var(--checkboxPaddingRight) var(--checkboxPaddingBottom)
      var(--checkboxPaddingLeft) !important;
    min-height: var(--checkboxHeight);
  }
}
</style>
