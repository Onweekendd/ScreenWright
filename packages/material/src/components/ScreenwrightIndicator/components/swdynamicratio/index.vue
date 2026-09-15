<!-- 环比同比图 -->
<template>
  <div class="ft-dynamicratio" :style="styleSizeName">
    <div ref="box" class="flex" :style="styleBox">
      <template v-if="isCustomType">
        <img :src="customUrl" :style="customStyle" v-if="customUrl && customUrl.length > 0" />
      </template>
      <template v-else>
        <i :class="`iconfont ${iconType}`" :style="iconStyle" />
      </template>
      <span ref="text" :style="styleName">{{ curText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { has } from "lodash-es";

import type { ComponentType } from "@screenwright/types";

import { useDynamicRatio } from "./useDynamicRatio";

defineOptions({
  name: "ftdynamicratio"
});
const props = defineProps<{
  element: ComponentType;
}>();

const {
  box,
  text,
  curText,
  styleName,
  styleBox,
  iconType,
  iconStyle,
  styleSizeName,
  isCustomType,
  customUrl,
  customStyle
} = useDynamicRatio(props.element);
const initIconStyle = () => {
  let option = props.element.option;

  if (!has(props.element.option, "iconStyleMode")) {
    option.iconStyleMode = ["color", "custom"];
  }
  if (!has(props.element.option, "iconList")) {
    option.iconList = ["", ""];
  }
};
onMounted(() => {
  initIconStyle();
});
</script>

<style lang="scss" scoped>
.ft-dynamicratio {
  overflow: hidden;
}
</style>
