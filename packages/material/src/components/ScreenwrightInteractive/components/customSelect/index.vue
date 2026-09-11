<!-- 下拉框 -->
<template>
  <div
    class="ft-custom-select"
    @mouseenter="handleMouseEvent('mouseEnter', selectValue)"
    @mouseleave="handleMouseEvent('mouseLeave', selectValue)"
  >
    <el-select
      v-model="selectVal"
      ref="selectDomRef"
      :class="customSelectClasses"
      :placeholder="option.placeholder"
      size="small"
      :teleported="false"
      popper-class="select-box"
    >
      <el-option
        v-for="item in optionArr"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        :disabled="item.disabled"
      >
        <span class="dropdown-item" @click="changeValue(item)" v-html="item.label" :data-translate="item.label" />
      </el-option>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

// import { useBaseData } from "@screenwright/composables"
import type { ComponentType } from "@screenwright/types";

import { useCustomSelect } from "./useCustomSelect";

defineOptions({
  name: "customSelect"
});
// 定义props
const props = defineProps<{
  element: ComponentType;
}>();

// const { option } = useBaseData(props.element)

// 使用自定义hook
const {
  isBuild,
  selectDom: selectDomRef,
  optionArr,
  option,
  selectVal,
  selectValue,
  customSelectClasses,
  changeValue,
  handleMouseEvent
} = useCustomSelect(props);

const zIndex = computed(() => {
  return isBuild.value ? 999 : 0;
});
const pointEventWrapper = computed(() => {
  return isBuild.value ? "none" : "auto";
});
</script>

<style lang="scss">
.ft-custom-select {
  --zIndex: v-bind(zIndex);
  --wrapperEvent: v-bind(pointEventWrapper);
  pointer-events: auto;
  width: 100%;
  height: 100%;
  .el-select {
    pointer-events: var(--wrapperEvent);
    z-index: var(--zIndex);
    --indent: 20px;
    --boxFontSize: 20px;
    --boxFontFamily: Source Han Sans CN-Normal;
    --boxlineHeight: 72;
    --boxColor: rgba(255, 255, 255, 1);
    --boxBackground: rgba(255, 255, 255, 0);
    --boxLetterSpacing: 1px;
    --boxFontStyle: normal;
    --boxFontWeight: normal;
    --boxTransform: translate(0, 0);
    --boxTextAlign: center;
    --dropDownHeight: 248px;
    --topOffset: 0;
    --selectTop: 0;
    --scrollBarWidth: 2px;
    --scrollBgColor: rgba(0, 120, 255, 1);
    --barBgColor: rgba(255, 255, 255, 0);
    --dropDownIconSize: 16px;
    --optionHeight: 42px;
    --optionSpace: 0;
    --defaultFontSize: 20px;
    --defaultFontFamily: Source Han Sans CN-Normal;
    --defaultlineHeight: 72;
    --defaultColor: rgba(66, 231, 251, 1);
    --defaultBackground: rgba(0, 0, 0, 0.2);
    --defaultLetterSpacing: 0.44px;
    --defaultFontStyle: normal;
    --defaultFontWeight: normal;
    --defaultTextAlign: center;
    --defaultLabelTransform: translate(0, 0);
    --hoverLabelTransform: translate(0, 0);
    --hoverTextAlign: center;
    --hoverFontSize: 20px;
    --hoverFontFamily: Source Han Sans CN-Normal;
    --hoverlineHeight: 72;
    --hoverColor: rgba(66, 231, 251, 1);
    --hoverLetterSpacing: 0.44px;
    --hoverFontStyle: normal;
    --hoverFontWeight: normal;
    --hoverTextAlign: center;
    --hoverBackground: rgba(255, 255, 255, 0);
    --hoverBackgroundImage: "";

    --selectBackgroundColor: rgba(0, 0, 0, 0.2);
    --selectBackgroundImage: "";
    --dropdownBackgroundColor: #2d2f38;
    // background:var(--boxBackground);

    // --boxBackgroundImage: url('http://47.107.118.42/upload/59b61c5c-fd62-4db1-8db0-307e2b1b4e79.png');
    // text-align: center;
    width: 100%;
    height: 100%;
    .el-select__wrapper {
      height: 100%;
      box-shadow: none !important;
    }
    .el-select__selection {
      background-color: transparent !important;
      // border: none;
      // padding: 0 10px 0 20px;
      // background-image: url(var(--boxBackgroundImage));
      // background: var(--boxBackgroundImage) no-repeat;
      // border-radius: 0;
      // font-size: 20px;
      // padding-left: var(--indent) !important;
      color: var(--boxColor) !important;
      font-family: var(--boxFontFamily);
      font-size: var(--boxFontSize);
      font-style: var(--boxFontStyle);
      font-weight: var(--boxFontWeight);
      letter-spacing: var(--boxLetterSpacing);
      transform: var(--boxTransform);
      text-align: var(--boxTextAlign);
      height: 100%;
      line-height: 100%;
      border: none !important;

      &::placeholder {
        // text-align: left;
        // display: inline-block;
        // padding-left: var(--indent);
        text-align: var(--boxTextAlign);
        color: var(--boxColor);
        font-family: var(--boxFontFamily);
        font-size: var(--boxFontSize);
        font-style: var(--boxFontStyle);
        font-weight: var(--boxFontWeight);
        letter-spacing: var(--boxLetterSpacing);
        transform: var(--boxTransform);
      }
      .el-select__placeholder {
        display: flex;
        justify-content: var(--boxTextAlign);
      }
      span {
        color: var(--boxColor);
      }
    }
    .el-select__suffix {
      pointer-events: auto;
      z-index: 999;
      top: 0;
      height: 100%;
      line-height: 100%;
      .el-select__caret {
        position: absolute;
        right: var(--rightMargin);
        width: var(--dropDownIconSize) !important;
        height: var(--dropDownIconSize) !important;
        line-height: var(--dropDownIconSize) !important;
      }
      .el-select__caret::before {
        content: "▼";
        font-style: normal;
        cursor: pointer;
        width: var(--dropDownIconSize) !important;
        height: var(--dropDownIconSize) !important;
        font-size: var(--dropDownIconSize);
        color: var(--contentColor);
        transform-origin: center center;
        background-position: center center;
        background-image: var(--dropDownIcon) !important;
        background-repeat: no-repeat;
        background-size: var(--dropDownIconSize) var(--dropDownIconSize);
      }
      .el-select__caret::after {
        content: "";
        height: 100%;
        width: 0;
        display: inline-block;
        vertical-align: middle;
      }
    }
    .el-select__popper {
      overflow: hidden;
      // max-height: 26px;
      top: 0.45px !important;
      background: transparent;
      border: none;
      // box-shadow: inset 0 0 16px #0078ff;
      background-image: linear-gradient(
        -45deg,
        rgba(0, 14, 37, 0.35) 0%,
        rgba(0, 14, 37, 0.5) 25%,
        transparent 25%,
        transparent 50%,
        rgba(0, 14, 37, 0.35) 50%,
        rgba(0, 14, 37, 0.35) 75%,
        transparent 75%
      );
      background-size: 80px 80px;
      border-radius: 0;
      .el-popper__arrow {
        display: none;
      }
    }
    .select-box {
      width: 100%;
      position: relative !important;
      background: var(--dropdownBackgroundColor) !important;
      left: 0 !important;
      margin: 0 !important;
      transform-origin: var(--selectTransformOrigin) !important;
      @keyframes top-start {
        0% {
          transform: scaleY(0);
        }
        100% {
          transform: scaleY(1);
        }
      }
      &.el-select__popper {
        top: var(--selectTop) !important;
        margin-top: var(--topOffset);
        height: var(--dropDownHeight) !important;
      }
    }
  }

  .dropdown-item {
    display: block;
    width: 100%;
  }
}
.select-box {
  background: transparent !important;
  height: 100% !important;
  .el-select-dropdown,
  .el-scrollbar {
    //   height: 100%;
    --el-scrollbar-opacity: 1;
    --el-scrollbar-background-color: #0078ff;
    --el-scrollbar-hover-opacity: 1;
    --el-scrollbar-hover-background-color: #0078ff;
    .el-select-dropdown__item {
      padding: 0;
      position: relative;
      color: var(--defaultColor) !important;
      font-family: var(--defaultFontFamily);
      font-size: var(--defaultFontSize);
      font-style: var(--defaultFontStyle);
      font-weight: var(--defaultFontWeight);
      letter-spacing: var(--defaultLetterSpacing);
      height: var(--optionHeight);
      margin-top: var(--optionSpace);
      line-height: var(--optionHeight);
      text-align: var(--defaultTextAlign);
      // background-color: rgba(0, 0, 0, 0.5);
      background: var(--defaultBackground);
      background-size: 100% 100%;
      span {
        transform: var(--defaultLabelTransform);
      }
      &.selected {
        background-image: var(--selectBackgroundImage) !important;
        background-color: var(--selectBackgroundColor) !important;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        color: var(--defaultColor) !important;
        // background: transparent !important;
        // background: var(--defaultBackground) !important;
        // background-size: 100% 100%;
      }
      &:hover:not(.is-disabled),
      &.hover:not(.is-disabled) {
        // box-shadow: inset 6px 0 10px -10px #0078ff,
        //   inset -6px 0 10px -10px #0078ff;
        color: var(--hoverColor) !important;
        font-family: var(--hoverFontFamily);
        font-size: var(--hoverFontSize);
        font-style: var(--hoverFontStyle);
        font-weight: var(--hoverFontWeight);
        letter-spacing: var(--hoverLetterSpacing);
        background-image: var(--hoverBackgroundImage) !important;
        background-color: var(--hoverBackground) !important;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        span {
          transform: var(--hoverLabelTransform);
        }

        // text-align: var(--hoverTextAlign);
      }
      &::after {
        content: "";
        width: 100%;
        height: 1px;
        background-image: linear-gradient(90deg, transparent, #007a8c, transparent);
        position: absolute;
        bottom: 0;
        left: 0;
      }
    }
    .el-select-dropdown__list {
      padding: 0 2px;
    }
    .el-scrollbar__bar.is-vertical {
      width: var(--scrollBarWidth);
      background-color: var(--scrollBgColor);
    }
    .el-scrollbar__thumb {
      background-color: var(--barBgColor);
    }
    .el-scrollbar__wrap {
      height: 100% !important;
      max-height: initial !important;
    }
  }
}
</style>
