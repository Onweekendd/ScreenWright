<!-- 多级下拉框 -->
<template>
  <div :class="cascaderClasses" ref="ftCascader">
    <el-cascader
      v-model="selectValue"
      ref="cascaderDom"
      :options="optionArr"
      :props="{
        expandTrigger: 'click',
        disabled: 'disabled',
        checkStrictly: false
      }"
      @change="changeValue as any"
      clearable
      :show-all-levels="true"
      :placeholder="option.placeholder"
      :popper-class="`${popperClass} ft-cascader-popper`"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import type { ComponentType } from "@screenwright/types";

import { useFtCascader } from "./useFtCascader";

defineOptions({
  name: "ftCascader"
});
const props = defineProps<{
  element: ComponentType;
}>();

const {
  ftCascader,
  cascaderDom,
  optionArr,
  selectValue,
  popperClass,
  option,
  cascaderClasses,
  changeValue,
  initDataAndStyle
} = useFtCascader(props.element);

// 组件挂载完成
onMounted(() => {
  initDataAndStyle();
});
</script>

<style lang="scss" scoped>
.ft-cascader {
  // 下面子元素全部padding设为0
  position: absolute;
  z-index: 9999;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  :deep(.el-cascader) {
    * {
      padding: 0;
    }
    width: 100%;
    height: 100%;
    // 输入框
    .el-input {
      width: 100%;
      height: 100%;
      --el-input-bg-color: var(--background) !important;
      .el-input__wrapper {
        --el-input-border-radius: var(--borderRadius) !important;
        // box-shadow: 0 0 0 var(--borderWidth) var(--borderColor) inset !important;
        // border: 0px solid var(--borderColor) !important;
      }
      .el-input__inner {
        padding: 0 10px;
        width: 100%;
        height: 100%;
        background: var(--background) !important;
        background-size: 100% 100% !important;
        color: var(--color) !important;
        font-family: "SourceHanSansCN-Normal,SourceHanSansCN";
        font-size: 20px;
        text-align: center;
        border-width: var(--borderWidth) !important;
        border-color: var(--borderColor) !important;
        border-style: solid;
        border-radius: var(--borderRadius) !important;
        text-align: var(--textAlign);
        &::placeholder {
          color: var(--color);
          font-family: var(--fontFamily);
          font-size: var(--fontSize);
          font-weight: var(--fontWeight);
          font-style: var(--fontStyle);
          letter-spacing: var(--letterSpacing);
          line-height: var(--lineHeight);
          text-align: var(--textAlign);
        }
      }
      .el-input__suffix {
        position: absolute;
        right: 5px;
        .el-input__suffix-inner {
          // display: none;
          .el-input__icon {
            width: var(--dropDownIconSize);
            height: var(--dropDownIconSize);
            background-image: var(--dropDownIcon) !important;
            background-repeat: no-repeat;
            background-size: 100% 100%;
            > svg {
              display: var(--iconDisplay);
            }
          }
        }
      }
    }
  }
}
</style>
<style lang="scss">
.ft-cascader {
  // 输入框icon
  .el-input__icon::before {
    color: var(--contentColor);
    font-size: var(--dropDownIconSize);
    background-image: var(--dropDownIcon) !important;
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
}
// 下拉框
//.el-cascader__dropdown
.ft-cascader-popper {
  margin-top: var(--dropdownMarginTop) !important;
  background: transparent;
  border: 0 !important;
  .el-cascader-menu {
    border: 0;
    color: #b4b7c1;
    min-width: 120px;
    min-height: 0px;
    .el-cascader-menu__wrap {
      // height: 100%;
      max-height: var(--dropdownMaxHeight);
      margin-bottom: 0;
    }
    .el-cascader-node {
      height: var(--menuHeight);
      padding: 0;
      &:not(:first-child) {
        margin-top: var(--menuMarginTop);
      }
      // 选项节点
      .el-cascader-node__label {
        height: 100%;
        padding: 0;
        padding-right: 20px;
        padding-left: var(--menuMarginLeft);
        color: var(--menuDefaultColor);
        font-family: var(--menuDefaultFontFamily);
        font-size: var(--menuDefaultFontSize);
        font-weight: var(--menuDefaultFontWeight);
        font-style: var(--menuDefaultFontStyle);
        letter-spacing: var(--menuDefaultLetterSpacing);
        line-height: var(--menuDefaultLineHeight);
        background: var(--menuDefaultBackground) !important;
        background-size: 100% 100% !important;
        &:hover {
          color: var(--menuHoverColor);
          font-family: var(--menuHoverFontFamily);
          font-size: var(--menuHoverFontSize);
          font-weight: var(--menuHoverFontWeight);
          font-style: var(--menuHoverFontStyle);
          letter-spacing: var(--menuHoverLetterSpacing);
          line-height: var(--menuHoverLineHeight);
          background: var(--menuHoverBackground) !important;
          background-size: 100% 100% !important;
        }
      }
    }
    // 下拉框滚动条
    .el-scrollbar__bar.is-vertical {
      width: var(--scrollBarWidth);
      background-color: var(--scrollBackgroundColor);
      .el-scrollbar__thumb {
        background-color: var(--scrollBarColor);
      }
    }
    // 选项选中效果和高亮保持一致
    .el-cascader-node:not(.is-disabled):focus,
    .el-cascader-node:not(.is-disabled):hover {
      color: var(--menuHoverColor);
      font-family: var(--menuHoverFontFamily);
      font-size: var(--menuHoverFontSize);
      font-weight: var(--menuHoverFontWeight);
      font-style: var(--menuHoverFontStyle);
      letter-spacing: var(--menuHoverLetterSpacing);
      line-height: var(--menuHoverLineHeight);
      background: var(--menuHoverBackground) !important;
      background-size: 100% 100% !important;
    }
    // 与上面一致 之后不加其他配置可以合并
    .el-cascader-node.in-active-path,
    .el-cascader-node.is-active,
    .el-cascader-node.is-selectable.in-checked-path {
      color: var(--menuHoverColor) !important;
      font-family: var(--menuHoverFontFamily) !important;
      font-size: var(--menuHoverFontSize) !important;
      font-weight: var(--menuHoverFontWeight) !important;
      font-style: var(--menuHoverFontStyle) !important;
      letter-spacing: var(--menuHoverLetterSpacing) !important;
      line-height: var(--menuHoverLineHeight) !important;
      background: var(--menuHoverBackground) !important;
      background-size: 100% 100% !important;
    }
    // 下拉框整体
    .el-cascader-menu__list {
      padding: 0;
      background-color: var(--dropdownBackgroundColor);
    }
  }
}
</style>
