<template>
  <div class="layout-constraint-container">
    <div class="select-box flex flex-column flex-justify-between">
      <el-select
        class="item-selector"
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="verticalConst"
      >
        <el-option v-for="item in verticalOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <el-select
        class="item-selector"
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="horizontalConst"
      >
        <el-option v-for="item in horizontalOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="direction-box">
      <div class="layout-box">
        <div
          v-for="item in verticalItems"
          :key="item.direction"
          :class="[
            'constraint-item constraint-item-vertical',
            item.direction,
            { active: item.direction === verticalConst }
          ]"
          :style="{ zIndex: item.direction === verticalConst ? 1 : 0 }"
          @click="selectVertical(item.direction)"
        />

        <div
          v-for="item in horizontalItems"
          :key="item.direction"
          :class="['constraint-item', item.direction, { active: item.direction == horizontalConst }]"
          :style="{ zIndex: item.direction === horizontalConst ? 1 : 0 }"
          @click="selectHorizontal(item.direction)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { horizontalConstEnum, verticalConstEnum } from "@screenwright/types";

import { horizontalOption, verticalOption } from "./type";
// 垂直方向选项列表
const verticalItems = [
  { direction: verticalConstEnum.Top },
  { direction: verticalConstEnum.Center },
  { direction: verticalConstEnum.Bottom }
];

// 水平方向选项列表
const horizontalItems = [
  { direction: horizontalConstEnum.Left },
  { direction: horizontalConstEnum.Center },
  { direction: horizontalConstEnum.Right }
];

interface Constraint {
  verticalConst: verticalConstEnum; //纵向
  horizontalConst: horizontalConstEnum; //横向
}

const props = defineProps({
  modelValue: {
    type: Object as () => Constraint,
    required: true
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

const verticalConst = computed<string>({
  get: () => props.modelValue?.verticalConst ?? verticalConstEnum.Top,
  set: (val) => {
    emit("update:modelValue", { ...props.modelValue, verticalConst: val ?? verticalConstEnum.Top });
    emit("change", val);
  }
});

const horizontalConst = computed<string>({
  get: () => props.modelValue?.horizontalConst ?? horizontalConstEnum.Left,
  set: (val) => {
    emit("update:modelValue", { ...props.modelValue, horizontalConst: val ?? horizontalConstEnum.Left });
    emit("change", val);
  }
});

// 切换垂直方向选中状态
const selectVertical = (direction: verticalConstEnum) => {
  verticalConst.value = direction;
};

// 切换水平方向选中状态
const selectHorizontal = (direction: horizontalConstEnum) => {
  horizontalConst.value = direction;
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-input__wrapper");
.layout-constraint-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;

  .select-box {
    width: 100%;
    height: 70px;
    flex-grow: 1;
    margin-right: 15px;
    .item-selector {
      margin-bottom: 12px;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .direction-box {
    flex-grow: 0;
    padding: 18px;
    background-color: #2d313a !important; /* 深色背景 */

    .layout-box {
      width: 70px;
      height: 30px;
      background-color: #1a2435; /* 内部深色块 */
      border-radius: 3px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      .constraint-item {
        position: absolute;
        width: 15px;
        height: 3px;
        background-color: #4a5568;
        border-radius: 5px;
        transition: background-color 0.2s;
        cursor: pointer;
        &.constraint-item-vertical {
          width: 3px;
          height: 15px;
        }
        &.active {
          background-color: #56abfb; /* 高亮蓝色 */
        }
        /* 四个方向定位 */
        &.Top {
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
        }
        &.Right {
          right: -18px;
          top: 50%;
          transform: translateY(-50%);
        }
        &.Bottom {
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
        }
        &.Left {
          left: -18px;
          top: 50%;
          transform: translateY(-50%);
        }
      }
    }
  }
  // background-color: #2d313a; /* 深色背景 */

  // padding: 22px;
  // box-sizing: border-box;

  // /* 约束点通用样式 */
}
</style>
