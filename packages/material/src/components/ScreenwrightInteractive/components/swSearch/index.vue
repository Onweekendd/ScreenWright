<!-- 搜索框组件 -->
<template>
  <div class="ft-search">
    <div
      :class="{
        'default-search': true,
        'has-bind': events?.length && isBuild.value
      }"
      :style="styleDefaultFont"
    >
      <el-input
        ref="inputSearchRef"
        class="input-with-search"
        :style="styleDefaultItem"
        :placeholder="option.placeholder"
        v-model="inputValue"
        @change="handleInputChange"
      >
        <template v-if="option.isButton" #[slotName]>
          <el-button
            :style="styleButton"
            :icon="option.buttonIconType === 'default' || !option.buttonIconType ? Search : undefined"
            @click.stop="handleClick(null, false)"
          >
            <img
              v-if="option.buttonIconType === 'custom' && option.buttonIcon"
              :src="setMinioUrl(option.buttonIcon)"
              alt=""
              :style="{ width: option.buttonIconWidth + 'px', height: option.buttonIconHeight + 'px' }"
            />
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { Search } from "@element-plus/icons-vue";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "ftSearch"
});

// 定义props
const props = defineProps<{
  element: ComponentType;
}>();

// 使用基础数据
const { option, dataChart, events, isBuild, handleEncode, handleEventAndCallbackEvent } = useBaseData(props.element);
const { addEvent } = useActionEvent();

// 响应式状态
const inputSearchRef = ref<any>(null);
const inputValue = ref("");

// 计算属性
// const styleSizeName = computed<CSSProperties>(() => {
//   return {
//     width: `${option.value.width || 100}%`,
//     height: `${option.value.height || 30}px`
//   };
// });

const buttonPosition = computed(() => {
  return option.value.buttonPosition || "right";
});

const styleDefaultFont = computed<CSSProperties>(() => {
  return {
    color: option.value.fontColor,
    fontSize: `${option.value.fontSize || 12}px`,
    fontWeight: option.value.fontWeight,
    fontFamily: option.value.fontFamily,
    fontStyle: option.value.fontStyle
  };
});

const styleTipFont = computed<CSSProperties>(() => {
  return {
    color: option.value.fontColorTip,
    fontSize: `${option.value.fontSizeTip || 12}px`,
    fontWeight: option.value.fontWeightTip,
    fontFamily: option.value.fontFamilyTip,
    fontStyle: option.value.fontStyleTip
  };
});

const styleDefaultItem = computed<CSSProperties>(() => {
  return {
    border: `${option.value.borderWidth || 0}px solid ${option.value.borderColor}`,
    borderRadius: `${option.value.borderRadius || 0}px`,
    background:
      option.value.backgroundType === "color"
        ? option.value.backgroundColor
        : `url(${setMinioUrl(option.value.backgroundImage)}) 50% 50% / ${
            option.value.backgroundImageType || "cover"
          } no-repeat`
  };
});

const styleButton = computed<CSSProperties>(() => {
  return {
    background:
      option.value.backgroundTypeBtn === "color"
        ? option.value.backgroundColorBtn
        : `url(${setMinioUrl(option.value.backgroundImageBtn)}) 50% 50% / ${
            option.value.backgroundImageTypeBtn || "cover"
          } no-repeat`,
    fontSize: `${option.value.buttonIconSize || 16}px`,
    color: option.value.buttonIconColor || "rgba(255, 255, 255, 0.8)"
  };
});

// 定义计算属性 slotName 替代原来的内联表达式
const slotName = computed(() => {
  return buttonPosition.value === "left" ? "prepend" : "append";
});

// 方法
const setTipStyle = (val = styleTipFont.value) => {
  console.log(val, "val", styleTipFont.value);
  if (inputSearchRef.value) {
    // fontWeight: option.value.fontWeighTip ? "bold" : "normal",
    // fontFamily: option.value.fontFamilyTip,
    // fontStyle: option.value.fontStyleTip ? "italic" : "normal"
    const searchDom = inputSearchRef.value.$el;
    searchDom.style.setProperty("--fontColor", styleTipFont.value.color);
    searchDom.style.setProperty("--fontSize", styleTipFont.value.fontSize);
    searchDom.style.setProperty("--fontWeight", styleTipFont.value.fontWeight);
    searchDom.style.setProperty("--fontFamily", styleTipFont.value.fontFamily);
    searchDom.style.setProperty("--fontStyle", styleTipFont.value.fontStyle);
  }
};

const handleInputChange = () => {
  // 处理输入框变化
  const info = { value: inputValue.value };
  // 处理编码
  handleEncode(info);

  // 回调事件
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Change,
    events: props.element.events,

    throwValue: info
  });
};

const handleClick = (isMsg?: any, isChange?: boolean) => {
  if (isChange && option.value.isButton) return;

  let info = Array.isArray(dataChart.value) ? dataChart.value[0] : dataChart.value;

  if (!info) {
    info = {};
  }

  info.value = inputValue.value;

  // 处理事件

  // 处理编码
  handleEncode(info);

  // 回调事件
  // callbackEvent(info)
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: info
  });
};

// 监听数据变化
watch(
  () => dataChart.value,
  (val) => {
    if (val) {
      if (Array.isArray(val)) {
        inputValue.value = val?.[0]?.value || "";
      } else {
        inputValue.value = val?.value || "";
      }

      const info = { value: inputValue.value };
      // 处理编码
      handleEncode(info);

      // 处理回调
      // callbackEvent(info)
      handleEventAndCallbackEvent({
        id: props.element.id,
        triggerType: EventTypeEnum.DataChange,
        events: props.element.events,

        throwValue: info
      });
    } else {
      inputValue.value = "";
    }
  },
  { deep: true, immediate: true }
);

// 监听样式变化
watch(styleTipFont, (val) => {
  setTipStyle(val);
});

// 监听文本缩进变化
watch(
  () => option.value.textIndent,
  (val) => {
    if (inputSearchRef.value) {
      const searchDom = inputSearchRef.value.$el;
      searchDom.style.setProperty("--textIndent", `${val || 0}px`);
    }
  }
);

// 监听按钮宽度变化
watch(
  () => option.value.buttonWidth,
  (val) => {
    if (inputSearchRef.value) {
      const searchDom = inputSearchRef.value.$el;
      searchDom.style.setProperty("--buttonWidth", `${val || 0}px`);
    }
  }
);

// 组件挂载
onMounted(() => {
  nextTick(() => {
    setTipStyle();
  });

  // 注册组件事件到全局事件系统
  addEvent({
    [`${interactiveEnum.FtSearch}-${props.element.id}`]: {
      handleClick
    }
  });
});
</script>

<style lang="scss" scoped>
.ft-search {
  width: 100%;
  height: 100%;
}
.default-search {
  height: 100%;
  text-align: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  &.has-bind::after {
    content: "\e658";
    color: #ffffff;
    font-family: "iconfont" !important;
    font-size: 16px;
    font-style: normal;
    width: 16px;
    height: 16px;
    background: #e8aa2e;
    position: absolute;
    right: 0;
    top: 0;
  }

  :deep(.input-with-search) {
    height: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;
    font-size: inherit;
    --fontColor: rgba(255, 255, 255, 0.1);
    --fontSize: 16px;
    --fontWeight: normal;
    --fontFamily: "sans-serif";
    --fontStyle: normal;
    --textIndent: 0;
    --buttonWidth: v-bind("option.buttonWidth + 'px'");
    .el-input__wrapper {
      height: 100%;
      width: 100%;
      background-color: unset;
      border: none !important;
      box-shadow: none !important;
    }
    .el-input__inner::placeholder {
      font-style: var(--fontStyle);
      font-family: var(--fontFamily);
      font-weight: var(--fontWeight);
      font-size: var(--fontSize);
      color: var(--fontColor);
    }
    .el-input__inner {
      height: 100%;
      color: inherit !important;
      background: transparent !important;
      border: none !important;
      text-indent: v-bind("option.textIndent+'px'");
      font-style: v-bind("option.fontStyle ? 'italic' : 'normal'");
      font-family: v-bind("option.fontFamily");
      font-weight: v-bind("option.fontWeight? 'bolder' : 'normal'");
      font-size: v-bind("option.fontSize");
      color: v-bind("option.fontColor");
    }
    .el-input-group__append,
    .el-input-group__prepend {
      height: 100%;
      width: var(--buttonWidth);
      padding: 0;
      box-shadow: none !important;
      background: transparent;
      border: none !important;
      font-style: var(--fontStyle);
      font-family: var(--fontFamily);
      font-weight: var(--fontWeight);
      font-size: var(--fontSize);
      color: var(--fontColor);
      .el-button {
        height: 100%;
        width: 100%;
        padding: 0;
        margin: 0;
      }
    }
  }
}
</style>
