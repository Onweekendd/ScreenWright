<!-- 翻牌器 -->
<template>
  <div class="ft-flop-performance" :style="styleSizeName">
    <div v-for="(item, index) in listData.filter(Boolean)" :key="index" :style="styleParentSize">
      <el-tooltip
        :disabled="!item.formatter"
        placement="top-start"
        :style="[
          {
            backgroundColor: item.backgroundColor || option.backgroundColor
          }
        ]"
      >
        <template #content>
          <div v-html="item.formatter && item.formatter()" />
        </template>
        <div
          :class="{
            'ft-flop-item': true,
            'ft-flop-item-none': statusDIC.includes(item) || type === '',
            'ft-flop-item-whole': isWhole,
            'ft-flop-item-img': isWhole && (isImg || isBorder)
          }"
          :style="!isWhole ? '' : { ...styleName, ...styleParentName }"
          @click="handleClick(item, index)"
          style="background-color: rgba(255, 255, 255, 0)"
        >
          <!-- 仅显示数字 -->
          <sw-count-up
            ref="ftCountUpRef"
            v-if="isWhole"
            :useGrouping="option.useGrouping"
            :decimals="decimals"
            :prefixData="getformatterData(item.value)"
            :end="item.value"
            :autoplay="option.autoplay"
            :intervalTime="option.intervalTime"
            :incrementFrequency="option.autoIncrement ? option.incrementFrequency : undefined"
            :autoIncrement="option.autoIncrement"
            :duration="option.duration"
            :style="{
              ...fontColorLinear
            }"
          />
          <!-- 前缀、数值、后缀 -->
          <div class="ft-flop-count" :style="isWholeStyle" v-else>
            <!-- 前缀 -->
            <span
              :style="prefixStyle"
              v-if="getValByProp(item, 'prefixText')"
              :data-translate="getValByProp(item, 'prefixText')"
            >
              {{ getValByProp(item, "prefixText") }}
            </span>
            <div
              :class="{
                'ft-flop-item': true,
                'ft-flop-item-none': statusDIC.includes(item.value) || type === '',
                'ft-flop-item-img': isImg
              }"
              @click="handleClick(item, 0)"
              :style="{ ...styleName, display: 'inline-block', ...styleParentName }"
            >
              <div v-if="statusDIC.includes(item)">
                {{ item.data || item.value }}
              </div>
              <sw-count-up
                ref="ftCountUpRef"
                :decimals="decimals"
                v-else
                :useGrouping="option.useGrouping"
                :prefixData="getformatterData(item.value)"
                :end="item.value"
                :autoplay="option.autoplay"
                :intervalTime="option.intervalTime"
                :incrementFrequency="option.autoIncrement ? option.incrementFrequency : undefined"
                :duration="option.duration"
                :style="{
                  ...fontColorLinear,
                  ...filterStyle
                }"
              />
            </div>
            <!-- 后缀 -->
            <span
              :style="suffixStyle"
              v-if="getValByProp(item, 'suffixText')"
              :data-translate="getValByProp(item, 'suffixText')"
            >
              {{ getValByProp(item, "suffixText") }}
            </span>
          </div>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";

import { SwCountUp } from "@screenwright/ui/SwCountUp";
import { has, isArray } from "lodash-es";

import type { ComponentType } from "@screenwright/types";

import { useSwFlop } from "./useSwFlop";

interface Props {
  element: ComponentType;
}

const props = defineProps<Props>();

const {
  option,
  dataChart,
  dataChartItem,
  styleSizeName,
  statusDIC,
  listData,
  ftCountUpRef,
  decimals,
  isWhole,
  type,
  isBorder,
  isImg,
  styleName,
  styleParentSize,
  styleParentName,
  fontColorLinear,
  isWholeStyle,
  prefixStyle,
  suffixStyle,
  filterStyle,
  handleClick,
  getformatterData,
  getValByProp,
  setDelayLoading
} = useSwFlop(props);

watch(
  () => dataChart.value,
  (nv) => {
    if (isArray(nv) && nv.length) {
      dataChartItem.value = nv[0];
    } else {
      dataChartItem.value = nv;
    }
    setDelayLoading();
  }
);

// watch(
//   () => option.value,
//   () => {
//     console.log("配置项发生变化", option.value);
//     setDelayLoading();
//   },
//   { deep: true }
// );

const initSuffixLinearColor = async () => {
  const target = props.element as any;

  if (target && !has(target.option, "suffixSetFontLinear")) {
    console.log("initSuffixLinearColor 需要初始化", props.element);

    target.option.suffixSetFontLinear = false;
    target.option.suffixFontLinearColor = "linear-gradient(286.0deg,rgba(126,255,77,1) 0.0,rgba(30,213,64,0) 100.0%)";
  }
};

// 组件挂载后，如果数据已存在，启动自增功能
onMounted(() => {
  initSuffixLinearColor();
  if (dataChart.value) {
    if (isArray(dataChart.value) && dataChart.value.length) {
      dataChartItem.value = dataChart.value[0];
    } else {
      dataChartItem.value = dataChart.value;
    }
    setDelayLoading();
  }
});
</script>

<style lang="scss" scoped>
.ft-flop-performance {
  width: 100%;
  height: 100%;
}
</style>
