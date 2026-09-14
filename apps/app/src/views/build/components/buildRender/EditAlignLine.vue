<template>
  <div class="go-edit-align-line">
    <div
      class="line"
      v-for="item in line.lineArr"
      :key="item"
      :class="[item.includes('row') ? 'row' : 'col', line['select'].has(item) && 'visible']"
      :style="useComponentStyle(line['select'].get(item))"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";

import { throttle } from "lodash-es";

import { useEditStore } from "./hooks/useEditStore";
import { EditCanvasTypeEnum } from "./type";
import { setComponentPosition } from "./utils";

const chartEditStore = useEditStore();

// * 线条集合
const line = reactive({
  // 行横向row（上中下），列竖线col（左中右）
  lineArr: ["rowt", "rowc", "rowb", "coll", "colc", "colr"],
  // 展示线
  select: new Map(),
  // 已经吸附
  sorptioned: {
    x: false,
    y: false
  }
});

// * 位置计算
const useComponentStyle = (attr?: Partial<{ x: number; y: number }>) => {
  if (!attr) return {};
  const componentStyle = {
    left: `${attr.x ? attr.x : 0}px`,
    top: `${attr.y ? attr.y : 0}px`
  };
  return componentStyle;
};

// 颜色
const themeColor = computed(() => {
  return "var(--sw-theme-color)";
});

// * 吸附距离
const minDistance = computed(() => {
  return 10;
});

// * 是否开始计算
const isComputedLine = computed(() => {
  // IS_DRAG 移动时为 true，Drag Hook里设置
  const isDrag = chartEditStore.editCanvas.value[EditCanvasTypeEnum.IS_DRAG];
  return isDrag;
});

// * 吸附判定
const isSorption = (selectValue: number, componentValue: number) => {
  const isSorption = Math.abs(selectValue - componentValue) <= minDistance.value;
  return isSorption;
};

// * 当前目标
const selectId = computed(() => chartEditStore.targetChart.value.selectId);
const selectTarget = computed(() => chartEditStore.fetchTargetById(selectId.value[0]));
const selectAttr = computed(() => selectTarget.value);

// * 监听鼠标移动
watch(
  () => chartEditStore.mousePosition.value,
  throttle(() => {
    try {
      if (!isComputedLine.value || selectId.value.length !== 1 || !selectAttr.value) return;
      // 获取目标组件数据

      const selectW = selectAttr.value.component.width;
      const selectH = selectAttr.value.component.height;
      // 距离左侧
      const selectLeftX = selectAttr.value.left;
      const selectHalfX = selectLeftX + selectW / 2;
      const selectRightX = selectLeftX + selectW;

      // 距离顶部
      const selectTopY = selectAttr.value.top;
      const selectHalfY = selectTopY + selectH / 2;
      const selectBottomY = selectTopY + selectH;

      line.select.clear();
      line.sorptioned.y = false;
      // 循环查询所有组件数据
      const componentList = chartEditStore.componentList.value.map((e: any) => {
        return {
          id: e.id,
          width: e.width,
          height: e.height,
          left: e.left,
          top: e.top
        };
      });
      // 传入画布数据
      line.lineArr.forEach((lineItem) => {
        componentList.forEach((component: any) => {
          // 排除自身
          if (`${selectId.value[0]}` === `${component.id}`) return;
          const componentW = component.component.width;
          const componentH = component.component.height;

          // 距离左侧
          const componentLeftX = component.left;
          const componentHalfX = componentLeftX + componentW / 2;
          const componentRightX = componentLeftX + componentW;

          // 距离顶部
          const componentTopY = component.top;
          const componentHalfY = componentTopY + componentH / 2;
          const componentBottomY = componentTopY + componentH;
          // 横线对比的是 Y
          if (lineItem.includes("rowt")) {
            // 顶部
            if (isSorption(selectTopY, componentTopY)) {
              line.select.set(lineItem, { y: componentTopY });
              setComponentPosition(selectTarget.value, selectLeftX, componentTopY);
            }
            if (isSorption(selectTopY, componentHalfY)) {
              line.select.set(lineItem, { y: componentHalfY });
              setComponentPosition(selectTarget.value, selectLeftX, componentHalfY);
            }
            if (isSorption(selectTopY, componentBottomY)) {
              line.select.set(lineItem, { y: componentBottomY });
              setComponentPosition(selectTarget.value, selectLeftX, componentBottomY);
            }
          }
          if (lineItem.includes("rowc")) {
            // 顶部
            if (isSorption(selectHalfY, componentTopY)) {
              line.select.set(lineItem, { y: componentTopY });
              setComponentPosition(selectTarget.value, selectLeftX, componentTopY - selectH / 2);
            }
            if (isSorption(selectHalfY, componentHalfY)) {
              line.select.set(lineItem, { y: componentHalfY });
              setComponentPosition(selectTarget.value, selectLeftX, componentHalfY - selectH / 2);
            }
            if (isSorption(selectHalfY, componentBottomY)) {
              line.select.set(lineItem, { y: componentBottomY });
              setComponentPosition(selectTarget.value, selectLeftX, componentBottomY - selectH / 2);
            }
          }
          if (lineItem.includes("rowb")) {
            // 顶部
            if (isSorption(selectBottomY, componentTopY)) {
              line.select.set(lineItem, { y: componentTopY });
              setComponentPosition(selectTarget.value, selectLeftX, componentTopY - selectH);
            }
            if (isSorption(selectBottomY, componentHalfY)) {
              line.select.set(lineItem, { y: componentHalfY });
              setComponentPosition(selectTarget.value, selectLeftX, componentHalfY - selectH);
            }
            if (isSorption(selectBottomY, componentBottomY)) {
              line.select.set(lineItem, { y: componentBottomY });
              setComponentPosition(selectTarget.value, selectLeftX, componentBottomY - selectH);
            }
          }

          // 纵线对比的是 X
          if (lineItem.includes("coll")) {
            if (isSorption(selectLeftX, componentLeftX)) {
              line.select.set(lineItem, { x: componentLeftX });
              setComponentPosition(selectTarget.value, componentLeftX, selectTopY);
            }
            if (isSorption(selectLeftX, componentHalfX)) {
              line.select.set(lineItem, { x: componentHalfX });
              setComponentPosition(selectTarget.value, componentHalfX, selectTopY);
            }
            if (isSorption(selectLeftX, componentRightX)) {
              line.select.set(lineItem, { x: componentRightX });
              setComponentPosition(selectTarget.value, componentRightX, selectTopY);
            }
          }
          if (lineItem.includes("colc")) {
            if (isSorption(selectHalfX, componentLeftX)) {
              line.select.set(lineItem, { x: componentLeftX });
              setComponentPosition(selectTarget.value, componentLeftX - selectW / 2, selectTopY);
            }
            if (isSorption(selectHalfX, componentHalfX)) {
              line.select.set(lineItem, { x: componentHalfX });
              setComponentPosition(selectTarget.value, componentHalfX - selectW / 2, selectTopY);
            }
            if (isSorption(selectHalfX, componentRightX)) {
              line.select.set(lineItem, { x: componentRightX });
              setComponentPosition(selectTarget.value, componentRightX - selectW / 2, selectTopY);
            }
          }
          if (lineItem.includes("colr")) {
            if (isSorption(selectRightX, componentLeftX)) {
              line.select.set(lineItem, { x: componentLeftX });
              setComponentPosition(selectTarget.value, componentLeftX - selectW, selectTopY);
            }
            if (isSorption(selectRightX, componentHalfX)) {
              line.select.set(lineItem, { x: componentHalfX });
              setComponentPosition(selectTarget.value, componentHalfX - selectW, selectTopY);
            }
            if (isSorption(selectRightX, componentRightX)) {
              line.select.set(lineItem, { x: componentRightX });
              setComponentPosition(selectTarget.value, componentRightX - selectW, selectTopY);
            }
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  }, 200),
  {
    deep: true
  }
);

// * 取消对齐线
watch(
  () => isComputedLine.value,
  (val: boolean) => {
    if (!val) {
      line.select.clear();
      line.sorptioned.y = false;
    }
  }
);
</script>

<style lang="scss" scoped>
.go-edit-align-line {
  .line {
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    border-width: 1px;
    border-style: solid;
    border-color: v-bind("themeColor");
    opacity: 0.7;
    &.visible {
      display: block;
    }
  }
  .row {
    width: 100%;
  }
  .col {
    height: 100%;
  }
}
</style>
