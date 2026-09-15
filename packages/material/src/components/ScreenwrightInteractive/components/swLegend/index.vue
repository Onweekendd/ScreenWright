<!-- 图例 -->
<template>
  <div class="ft-legend" ref="ftLegend">
    <!-- {{ legendCheckedList }}
    {{ dataChart }}  
          :default-checked-keys="legendCheckedList"-->
    <el-tree
      ref="treeRef"
      :class="componentClasses"
      :data="dataChart"
      :props="defaultProps"
      node-key="value"
      :default-expand-all="option.expandAll"
      @check="changeValue"
      show-checkbox
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

import { type TreeInstance } from "element-plus";
import { cloneDeep, isArray } from "lodash-es";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
// import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "ftLegend"
});
// 定义props
const props = defineProps<{
  element: ComponentType;
}>();

interface LegendItem {
  label: string;
  value: string;
  isChecked: boolean;
  children?: LegendItem[];
}
// 使用基础数据
const { option, dataChart, componentClasses, handleEncode, handleEventAndCallbackEvent } = useBaseData(props.element);
const { addEvent } = useActionEvent();

// b函数用于生成BEM类名
// 响应式状态
const ftLegend = ref<HTMLElement | null>(null);
const treeRef = ref<TreeInstance | null>(null);
const defaultProps = {
  children: "children",
  label: "label"
};
const legendCheckedList = ref<string[]>([]);
const currentData = ref<any[]>([]); // 暂存当前勾选后变化的dataChart，用于回调参数，不改变原dataChart

// 方法
// 初始化样式
const init = () => {
  const legendDom = ftLegend.value;
  if (!legendDom) return;

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
  }

  // 背景类型(颜色、图片)
  const contentDom = treeRef.value?.$el;
  if (contentDom) {
    if (option.value.backgroundBackgroundType === "color") {
      contentDom.style.setProperty("background-color", option.value.backgroundBackgroundColor);
      contentDom.style.setProperty("background-image", "");
    } else {
      contentDom.style.setProperty("background-color", "transparent");
      contentDom.style.setProperty("background-image", `url(${setMinioUrl(option.value.backgroundBackgroundImage)})`);
    }
  }

  legendDom.style.setProperty("--expandAll", `${option.value.expandAll ? "none" : "inline-block"}`);
  legendDom.style.setProperty("--expandSpace", `${option.value.expandSpace || 0}px`);

  const nodes = treeRef.value?.store._getAllNodes();
  if (!nodes) return;
  if (option.value.expandAll) {
    nodes.forEach((node) => {
      node.expanded = true;
    });
  } else {
    nodes.forEach((node) => {
      node.expanded = false;
    });
  }
};

// 遍历默认勾选
const traverseCheckedData = (data: any[]) => {
  if (!data || (isArray(data) && data.length === 0)) return;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let itemIsCheck = false;

    if (typeof item.isChecked === "string") {
      itemIsCheck = item.isChecked.toLowerCase() === "true" ? true : false;
    } else {
      itemIsCheck = item.isChecked as boolean;
    }

    if (itemIsCheck) {
      legendCheckedList.value.push(item.value);
    }

    if (item.children) {
      if (Object.prototype.toString.call(item.children) !== "[object Array]") {
        item.children = JSON.parse(item.children);
      }
      traverseCheckedData(item.children);
    }
  }
};

// 刷新数据的isChecked
const handleCheckedData = (optionData: any[], isCheckedList: string[]) => {
  const data = cloneDeep(optionData);
  return data.map((item) => {
    let res: LegendItem = {
      label: item.label,
      value: item.value,
      isChecked: isCheckedList.some((name) => name === item.value)
    };
    if (item.children) {
      res = {
        ...res,
        children: handleCheckedData(item.children, isCheckedList)
      };
    }
    return res;
  });
};

// 勾选
const changeValue = (data: LegendItem, checkedData: any, _isMsg?: boolean) => {
  currentData.value = handleCheckedData(currentData.value, checkedData.checkedKeys);
  let info = null;

  for (let index = 0; index < currentData.value.length; index++) {
    const element = currentData.value[index];
    if (element.label === data.label) {
      info = element;
      break;
    }
    // 遍历子元素
    if (element.children && element.children.some((item: any) => item.label === data.label)) {
      info = element.children.find((item: any) => item.label === data.label);
      break;
    }
  }
  if (info) {
    handleEncode(info);
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.Click,
      events: props.element.events,
      throwValue: info || {}
    });
  }
};

// 点击处理函数（供外部调用）
const handleClick = (info: any) => {
  // 直接调用原有的 changeValue 逻辑，但需要构造必要的参数
  if (info && info.label) {
    const checkedKeys = [...legendCheckedList.value];
    const isChecked = checkedKeys.includes(info.label);

    if (isChecked) {
      // 取消选中
      const index = checkedKeys.indexOf(info.label);
      checkedKeys.splice(index, 1);
    } else {
      // 选中
      checkedKeys.push(info.label);
    }

    const checkedData = { checkedKeys };
    changeValue(info, checkedData);
  }
};

// 监听数据变化
watch(
  () => dataChart.value,
  async (val) => {
    if (val && val.length > 0) {
      currentData.value = val;
      legendCheckedList.value = [];
      // await sleep(50);
      traverseCheckedData(val);
      treeRef.value?.setCheckedKeys(legendCheckedList.value);
      // 特殊处理，一般组件只会触发一次handleEventAndCallbackEvent，这里多少个数据就触发多少次
      val.forEach((info: any) => {
        // 第三个参数为true时会过滤掉事件动作类型为通信的事件动作，避免反复发送TCP/UDP
        handleEventAndCallbackEvent({
          id: props.element.id,
          triggerType: EventTypeEnum.DataChange,
          events: props.element.events,

          throwValue: info || {}
        });
        if (info.children?.length > 0) {
          info.children.forEach((item: any) =>
            handleEventAndCallbackEvent({
              id: props.element.id,
              triggerType: EventTypeEnum.DataChange,
              events: props.element.events,

              throwValue: item || {}
            })
          );
        }
      });
    }
  },
  { deep: true, immediate: true }
);

// 监听配置变化
watch(
  () => option.value,
  () => {
    nextTick(() => {
      init();
    });
  },
  { deep: true, immediate: true }
);

// 组件挂载
onMounted(() => {
  // 注册组件事件到全局事件系统
  addEvent({
    [`${interactiveEnum.SwLegend}-${props.element.id}`]: {
      handleClick
    }
  });
});
</script>

<style lang="scss" scoped>
.ft-legend {
  width: 100%;
  height: 100%;
  --expandAll: inline-block;
  --expandSpace: 0;
  :deep(.el-tree) {
    background-color: var(--backgroundBackgroundColor);
    border-radius: var(--backgroundBorderRadius);
    border: solid 1px var(--backgroundBorderColor);
    padding: 13px 22px 15px 15px;
    // pointer-events: all;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    height: 100%;
    overflow: auto;
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
    // top: calc(var(--checkboxWidth) / 4 / 2);
    // left: calc(var(--checkboxHeight) / 2 / 2 + 1px);

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
    margin: var(--checkboxPaddingTop) var(--checkboxPaddingRight) var(--checkboxPaddingBottom)
      var(--checkboxPaddingLeft) !important;
    min-height: var(--checkboxHeight);
    // padding-left: 0px !important;
    .el-tree-node__expand-icon {
      display: var(--expandAll);
    }
    .el-checkbox {
      margin-right: var(--expandSpace);
    }
  }
  :deep(.el-tree-node__expand-icon) {
    font-size: 30px;
  }
}
</style>
