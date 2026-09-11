<template>
  <el-switch
    :class="`customtableSwitch customTableList-switch-${column.switchType} id_${columnIndex}_${listIndex}`"
    :model-value="listItem[column.alias]"
    :active-color="column.switchActiveColor"
    :inactive-color="column.switchInactiveColor"
    :active-text="column.switchActiveText"
    :inactive-text="column.switchInactiveText"
    @change="handleChange"
    :style="switchStyle"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

import { setMinioUrl } from "@material/minioUrl";

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  listItem: {
    type: Object,
    required: true
  },
  listIndex: {
    type: Number,
    required: true
  },
  columnIndex: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(["switch-change"]);

// 计算属性：获取开关样式
const switchStyle = computed(() => {
  // 定义自定义CSS变量类型

  const style: any = {
    width: `${props.column.seriesYOffsetWidth}px`,
    height: `${props.column.seriesYOffsetHeight}px`,
    transform: `translate(${props.column.seriesYOffsetX}px, ${props.column.seriesYOffsetY}px)`,
    letterSpacing: `${props.column.switchLetterSpacing}px`,
    fontFamily: `${props.column.switchFontFamily}`,
    fontStyle: `${props.column.switchFontStyle}`,
    textShadow: props.column.switchIsTextShadow
      ? `${props.column.switchTextShadowColor} ${props.column.switchTextShadowX}px ${props.column.switchTextShadowY}px ${props.column.switchTextShadowBlur}px`
      : "",
    fontSize: `${props.column.switchFontSize}px`,
    "--fontColor": `${props.column.switchFontColor}`,
    "--fontWeight": `${props.column.switchFontWeight}`,
    "--borderRadius": `${Math.floor(props.column.seriesYOffsetHeight * 0.5)}px`
  };

  ["switchInactiveColor", "switchActiveColor", "pointColor", "switchPointSize", "switchFontSize"].forEach((field) => {
    const value = field.includes("Size") ? props.column[field] + "px" : props.column[field];
    if (props.column.switchType === "default" && field === "pointColor") {
      style["--pointColor"] = value;
      style["--pointColor2"] = `#3b445a`;
    } else if (props.column.switchType === "icon" && field === "pointColor") {
      style["--pointColor"] = `url(${setMinioUrl(props.column.switchActiveIcon || "")})`;
      style["--pointColor2"] = `url(${setMinioUrl(props.column.switchInactiveIcon || "")})`;
    } else if (props.column.switchType === "image" && field.includes("Color")) {
      if (field === "switchActiveColor") {
        style["--el-switch-on-color"] = `url(${setMinioUrl(props.column.switchActiveImage || "")})`;
      }
      if (field === "switchInactiveColor") {
        style["--el-switch-off-color"] = `url(${setMinioUrl(props.column.switchInactiveImage || "")})`;
      }
      if (field === "pointColor") {
        style["--pointColor"] = `transparent`;
        style["--pointColor2"] = `transparent`;
      }
    } else if (field === "switchInactiveColor") {
      style["--el-switch-off-color"] = value;
    } else if (field === "switchActiveColor") {
      style["--el-switch-on-color"] = value;
    } else {
      style[`--${field}`] = value;
    }
  });

  return style as any; // 使用 any 是因为 Vue 的样式类型系统和 TS 的类型不完全兼容
});

const handleChange = (val: any) => {
  emit("switch-change", props.column, props.columnIndex);
  // 处理编码 (原函数的逻辑)
  // eslint-disable-next-line vue/no-mutating-props
  props.listItem[props.column.alias] = val;
};
</script>
<style lang="scss" scoped>
.customtableSwitch {
  :deep(.el-switch__core) {
    width: 100%;
    height: 100%;
    border-radius: 60px;
    background-size: 100% 100% !important;
    background-repeat: no-repeat !important;
  }
  :deep(.el-switch__action) {
    height: var(--switchPointSize);
    width: var(--switchPointSize);
    background: var(--pointColor2);
    background-size: 100% 100%;
    background-repeat: no-repeat;
    border-radius: var(--borderRadius);
    // &.is-checked {
    //   background: var(--pointColor);
    // }
    &.is-active {
      color: var(--fontColor);
      font-weight: var(--fontWeight);
    }
  }
  &.is-checked {
    :deep(.el-switch__action) {
      background: var(--pointColor);
      background-size: 100% 100%;
      background-repeat: no-repeat;
      left: calc(100% - var(--switchPointSize)) !important;
    }
    :deep(.el-switch__core) {
      background: var(--el-switch-on-color);
    }
  }
  :deep(.el-switch__label) {
    white-space: nowrap;
    height: fit-content;
    font-weight: var(--fontWeight);
    & > span {
      font-size: var(--switchFontSize);
    }
    &.is-active {
      color: var(--fontColor);
    }
  }
}
</style>
