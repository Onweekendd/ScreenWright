<!-- 文字动画 -->
<template>
  <div class="ft-text2" :style="styleSizeName" ref="main">
    <div ref="box" class="flex" :style="styleBox">
      <template v-if="!dataIsArray">
        <span
          ref="boxRef"
          :contentEditable="isEdit"
          class="ft-text2-text"
          :style="{ ...styleName, ...getAssignStyle(inputData) }"
          @blur="onEditText(-1)"
          :data-translate="inputData.value"
        >
          {{ inputData.value }}
        </span>
      </template>
      <template v-else>
        <span
          v-for="(item, index) in option.textAnimationType === 'typingEffect' ? cloneDataChart : inputData"
          :key="index"
          ref="boxRef"
          class="ft-text2-text"
          :style="{
            ...styleName,
            ...textAnimation,
            ...getAssignStyle(inputData[0])
          }"
          :contentEditable="isEdit"
          @blur="onEditText(index)"
          :data-translate="item.value"
          v-html="item.value"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import { useFtText2 } from "./ftStatusText";

// 组件配置
const props = defineProps<{
  element: ComponentType;
}>();

defineOptions({
  name: "ftText2"
});

// 使用自定义 hook
const {
  main,
  box,
  boxRef,
  inputData,
  option,
  isEdit,
  styleSizeName,
  cloneDataChart,
  dataIsArray,
  styleBox,
  styleName,
  textAnimation,
  getAssignStyle,
  onEditText
} = useFtText2(props);

// 命名空间
</script>

<style lang="scss" scoped>
.ft-text2 {
  overflow: hidden;
  * {
    outline: none;
  }
}

@keyframes opacity-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
