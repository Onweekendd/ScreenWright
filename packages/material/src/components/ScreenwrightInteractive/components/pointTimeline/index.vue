<template>
  <div class="pointTimeline" :style="containerStyle">
    <div ref="svgLayout" :class="contentBoxClasses">
      <svg
        ref="svgRef"
        v-if="option.globalConfig.arrangementDirection === 'row'"
        :width="getSvgWidthOrHeight"
        :height="height"
        :viewBox="`0,0,${getSvgWidthOrHeight},${height}`"
        :style="rowSvgStyle"
      >
        <path
          :stroke-width="option.globalConfig.axisWidth"
          :stroke="option.globalConfig.axisColor"
          :d="`M${option.globalConfig.initMargin},${height / 2}h${option.globalConfig.shaftMargin * listData.length}`"
        />
        <g>
          <g v-for="(timeLineItem, timeLineIndex) in timeLineList" :key="timeLineIndex">
            <image
              :x="timeLineItem.imgX"
              :y="timeLineItem.imgY"
              :xlink:href="timeLineItem.imglinkHref"
              preserveAspectRatio="none meet"
              :width="timeLineItem.imgWidth"
              :height="timeLineItem.imgHeight"
              :transform="timeLineItem.imgTransform"
              @click.stop="selectSvgPointer(timeLineIndex)"
              style="cursor: pointer"
            />
            <foreignObject
              :x="timeLineItem.axialSpindleX"
              :y="timeLineItem.axialSpindleY"
              :width="timeLineItem.axialSpindleWidth"
              :height="timeLineItem.axialSpindleHeight"
              style="overflow: visible; transform: translate(0px, 0px) translate3d(0px, 0px, 0px)"
            >
              <p
                xmlns="http://www.w3.org/1999/xhtml"
                :style="getTextStyle(timeLineItem, 'axialSpindle')"
                :data-translate="listData[timeLineIndex].text"
              >
                {{ listData[timeLineIndex].text }}
              </p>
            </foreignObject>
            <foreignObject
              :x="timeLineItem.axialTitleX"
              :y="timeLineItem.axialTitleY"
              :width="getSvgWidthOrHeight"
              :height="height"
              style="text-align: center; pointer-events: none"
            >
              <div :style="getTitleStyle(timeLineItem)">
                <div
                  v-if="activeIndex === timeLineIndex || option.globalConfig.defaultExpansion"
                  :data-translate="listData[timeLineIndex].value"
                >
                  {{ listData[timeLineIndex].value }}
                </div>
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>
      <svg
        ref="svgRef"
        v-if="option.globalConfig.arrangementDirection === 'column'"
        :width="width"
        :height="getSvgWidthOrHeight"
        :viewBox="`0,0,${width},${getSvgWidthOrHeight}`"
        :style="columnSvgStyle"
      >
        <path
          :stroke-width="option.globalConfig.axisWidth"
          :stroke="option.globalConfig.axisColor"
          :d="`M${width / 2},${option.globalConfig.initMargin}V${getSvgWidthOrHeight}`"
        />
        <g>
          <g v-for="(timeLineItem, timeLineIndex) in timeLineList" :key="timeLineIndex">
            <image
              :x="timeLineItem.imgX"
              :y="timeLineItem.imgY"
              :xlink:href="timeLineItem.imglinkHref"
              preserveAspectRatio="none meet"
              :width="timeLineItem.imgWidth"
              :height="timeLineItem.imgHeight"
              :transform="timeLineItem.imgTransform"
              @click.stop="selectSvgPointer(timeLineIndex)"
              style="cursor: pointer"
            />
            <foreignObject
              :x="timeLineItem.axialSpindleX"
              :y="timeLineItem.axialSpindleY"
              :width="timeLineItem.axialSpindleWidth"
              :height="timeLineItem.axialSpindleHeight"
              style="overflow: visible; transform: translate(0px, 0px) translate3d(0px, 0px, 0px)"
            >
              <p
                xmlns="http://www.w3.org/1999/xhtml"
                :style="getTextStyle(timeLineItem, 'axialSpindle')"
                :data-translate="listData[timeLineIndex].text"
              >
                {{ listData[timeLineIndex].text }}
              </p>
            </foreignObject>
            <foreignObject
              :x="timeLineItem.axialTitleX"
              :y="timeLineItem.axialTitleY"
              :width="getSvgWidthOrHeight"
              :height="height"
              style="text-align: center; pointer-events: none"
            >
              <div :style="getTitleStyle(timeLineItem)">
                <div
                  v-if="activeIndex === timeLineIndex || option.globalConfig.defaultExpansion"
                  :data-translate="listData[timeLineIndex].value"
                >
                  {{ listData[timeLineIndex].value }}
                </div>
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

import type { ComponentType } from "@screenwright/types";

import { usePointTimeline } from "./usePointTimeline";

defineOptions({
  name: "pointTimeline"
});
// 定义组件的属性
const props = defineProps<{ element: ComponentType }>();

const {
  svgRef,
  svgLayout,
  listData,
  timeLineList,
  activeIndex,
  svgTranslate,
  getSvgWidthOrHeight,
  height,
  width,
  option,
  isBuild,
  encodes,
  events,
  selectSvgPointer
} = usePointTimeline(props.element);

// 样式计算属性
const containerStyle = computed<CSSProperties>(() => ({
  "pointer-events": isBuild.value ? "none" : "auto",
  width: `${width}px`,
  height: `${height}px`
}));

const contentBoxClasses = computed<CSSProperties>(() => ({
  contentBox: true,
  "component-bind-events": true,
  "has-bind": events.value?.length && isBuild.value,
  "has-encode": encodes.value?.length && isBuild.value
}));

const rowSvgStyle = computed(
  () => `
  padding-left: 30px;
  padding-top: 0px;
  transform: translateX(${svgTranslate.value}px);
  transition: all ${option.value.animationConfig.animateTranstion}s ease 0s;
  overflow: visible;
`
);

const columnSvgStyle = computed(
  () => `
  padding-left: 0px;
  padding-top: 30px;
  transform: translateY(${svgTranslate.value}px);
  transition: all ${option.value.animationConfig.animateTranstion}s ease 0s;
  overflow: visible;
`
);

// 文本样式生成方法
const getTextStyle = (item: any, prefix: string): CSSProperties => ({
  transform: `${item[`${prefix}Transform`]}`,
  fontFamily: `${item[`${prefix}FontFamily`]}`,
  fontSize: `${item[`${prefix}FontSize`]}px`,
  lineHeight: `${item[`${prefix}LineHeight`]}px`,
  color: `${item[`${prefix}Color`]}`,
  letterSpacing: `${item[`${prefix}LetterSpacing`]}px`,
  height: `${item[`${prefix}FontSize`]}px`,
  margin: "0px",
  fontWeight: `${item[`${prefix}FontWeight`]}`,
  fontStyle: `${item[`${prefix}FontStyle`]}`,
  wordBreak: "break-word",
  textAlign: item[`${prefix}TextAlign`],
  width: `${item[`${prefix}Width`]}px`
});

// 标题样式
const getTitleStyle = (item: any): CSSProperties => ({
  width: `${item.axialTitleWidth}px`,
  transition: "opacity 600ms ease 0s",
  opacity: 1,
  position: "absolute",
  top: "50%",
  left: "50%",
  fontFamily: `${item.axialTitleFontFamily}`,
  fontSize: `${item.axialTitleFontSize}px`,
  lineHeight: `${item.axialTitleLineHeight}px`,
  color: `${item.axialTitleColor}`,
  letterSpacing: `${item.axialTitleLetterSpacing}px`,
  fontWeight: `${item.axialTitleFontWeight}`,
  fontStyle: `${item.axialTitleFontStyle}`,
  transform: `${item.axialTitleTransform}`,
  textAlign: item.axialTitleTextAlign
});
</script>

<style lang="scss" scoped>
.pointTimeline {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;

  .contentBox {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
}
</style>
