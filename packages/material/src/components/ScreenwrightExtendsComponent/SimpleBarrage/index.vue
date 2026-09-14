<template>
  <div
    :class="{
      'simple-barrage': true,
      'component-bind-events': true,
      'has-bind': element.events?.length,
      'has-encode': element.encodes?.length
    }"
    :style="element.styleSizeName"
    ref="barrage"
  >
    <!-- 签名图片组件 -->
    <!-- 弹幕容器 - 使用ref传递实例便于调用方法 -->
    <barrage-container
      :key="barrageKey"
      :id="element.id"
      :option="option"
      :width="element.component.width"
      :height="element.component.height"
      :barrage-data="barrageData"
      :editable="editable"
      :screen-scale="screenScale"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

// 导入工具函数和API
import { cloneDeep } from "lodash-es";

import { useActionEvent } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import type { ExhibitEnumType } from "@screenwright/types";
import { ExtendsEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import BarrageContainer from "./components/BarrageContainer.vue";
// 导入子组件
import type { DataItem, Option } from "./type";

const { addEvent } = useActionEvent();

const props = defineProps<{
  element: ComponentType<ExhibitEnumType, Option>;
}>();
// 获取 props.element
const { dataChart, option, initData } = useBaseData<ExhibitEnumType, Option, DataItem[] | DataItem>(props.element);

// 响应式数据
const barrageData = ref<DataItem[]>([]);
const editable = ref<boolean>(false);
const screenScale = ref<number>(1);
const barrageKey = ref<number>(0);

// refs
const barrage = ref<HTMLDivElement>();

// 监听器
watch(
  () => dataChart.value,
  (newValue) => {
    if (newValue) {
      // 转换数据为数组格式
      const newData = Array.isArray(newValue) ? newValue : [newValue];

      // 更新数据
      barrageData.value = cloneDeep(newData);
    } else {
      // 只清空数据
      barrageData.value = [];
    }
  }
);

// 方法
const setScreenScale = () => {
  screenScale.value = getScaleValueFromContent(".view-wrapper") ?? 1;
};

const handleClick = async () => {
  await initData();
  barrageKey.value++;
};

const getScaleValueFromContent = (selector: string): number | null => {
  const content = document.querySelector(selector) as HTMLElement;
  if (content) {
    const transformValue = content.style.transform;
    const scaleMatch = transformValue.match(/scale\(([^)]+)\)/);
    return scaleMatch ? parseFloat(scaleMatch[1]) : null;
  }
  return null;
};
// 生命周期
onMounted(async () => {
  await nextTick();
  setScreenScale();

  window.addEventListener("resize", setScreenScale);

  // 初始化数据
  addEvent({
    [`${ExtendsEnum.SimpleBarrage}-${props.element.id}`]: {
      handleClick
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", setScreenScale);
});
</script>

<style lang="scss" scoped>
.simple-barrage {
  color: #ffffff;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
</style>
