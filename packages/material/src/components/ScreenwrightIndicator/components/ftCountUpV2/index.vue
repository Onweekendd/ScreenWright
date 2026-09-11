<!-- 翻牌器V2 -->
<template>
  <div class="ft-countup-v2 flex flex-align-end flex-justify-end" ref="countupV2Ref">
    <!-- 前缀 -->
    <span
      :style="prefixStyle"
      v-if="getValByProp(dataItem, 'prefixText')"
      :data-translate="getValByProp(dataItem, 'prefixText')"
    >
      {{ getValByProp(dataItem, "prefixText") }}
    </span>

    <!-- 数值 -->
    <div class="countup-value">
      <div
        v-for="(space, index) in option.completeCount"
        :key="index"
        :class="[
          'value-item',
          'flex',
          'flex-justify-center',
          pointIds.includes(index + 1) && option.useGrouping ? 'value-item2' : ''
        ]"
        :style="{
          ...styleName,
          'margin-right': pointIds.includes(index + 1) && option.useGrouping ? option.pointSize + 'px' : 'auto'
        }"
      >
        <span><i class="item" :style="fontColorLinear">0123456789</i></span>
        <div v-if="pointIds.includes(index + 1) && option.useGrouping" class="item-point">,</div>
      </div>
    </div>

    <!-- 后缀 -->
    <span
      :style="suffixStyle"
      v-if="getValByProp(dataItem, 'suffixText')"
      :data-translate="getValByProp(dataItem, 'suffixText')"
    >
      {{ getValByProp(dataItem, "suffixText") }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";

import { has } from "lodash-es";

import { useBaseFilter } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useCountUpV2 } from "./useCountUpV2";

defineOptions({
  name: "ftCountUpV2"
});
interface Props {
  element: ComponentType;
}

const props = defineProps<Props>();
const { option } = useBaseData(props.element);
const { inputData, initData } = useBaseFilter(props.element);
// 使用提取出的hook
const {
  countupV2Ref,
  dataItem,
  pointIds,
  prefixStyle,
  styleName,
  fontColorLinear,
  suffixStyle,
  getValByProp,
  renderCountup,
  setAutoIncrement
} = useCountUpV2(option, inputData);
watch(
  () => option.value.refreshKey,
  async () => {
    await initData();
    dataItem.value = inputData.value;
  },
  {
    deep: true
  }
);

const initSuffixLinearColor = async () => {
  const target = props.element as any;

  if (target && !has(target.option, "suffixSetFontLinear")) {
    console.log("initSuffixLinearColor 需要初始化", props.element);

    target.option.suffixSetFontLinear = false;
    target.option.suffixFontLinearColor = "linear-gradient(286.0deg,rgba(126,255,77,1) 0.0,rgba(30,213,64,0) 100.0%)";
  }
};

// 生命周期钩子
onMounted(async () => {
  initSuffixLinearColor();
  // 因为要看到滚动的过程，所以添加延迟，不然渲染完就结束了
  setTimeout(() => {
    if (dataItem.value?.value !== undefined) {
      renderCountup(dataItem.value.value);
      setAutoIncrement();
    }
  }, 1000);
});
</script>

<style lang="scss" scoped>
.ft-countup-v2 {
  opacity: 1;
  height: 100%;
  width: 100%;
  .countup-value {
    text-align: center;
    writing-mode: vertical-lr;
    text-orientation: upright;
    user-select: none;
  }

  .value-item {
    width: 50px;
    height: 65px;
    line-height: 65px;
    list-style: none;
    margin: 0 6px;
    position: relative;

    span {
      position: relative;
      display: inline-block;
      width: 100%;
      height: 100%;
      writing-mode: vertical-rl;
      text-orientation: upright;
      overflow: hidden;

      i {
        font-style: normal;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, 0);
        transition: transform 1s ease-in-out;
        letter-spacing: 10px;
      }
    }

    &.value-item2 {
      margin-right: 20px;
    }

    .item-point {
      width: 20px;
      position: absolute;
      right: 0;
      bottom: 0;
    }
  }
}
</style>
