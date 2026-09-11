<template>
  <div class="sw-label-type flex flex-align-center flex-justify-between" v-if="input">
    <el-select
      :style="selectStyle"
      popper-class="sw-select-dropdown"
      v-model="input.fontFamily"
      placeholder="Select"
      @change="handleChange('fontFamily')"
    >
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <SwInputNumber
      @change="handleChange('fontSize')"
      width="60"
      v-model="input.fontSize"
      controls
      class="sw-label-type-number"
      v-if="isShowFontSize"
    />
  </div>
</template>
<script setup lang="ts">
import { isUndefined } from "lodash-es";
import { FtLabelTypeProps, FtLabelTypeEmits } from "./SwLabelType";
import { useSwLabelType } from "./useSwLabelType";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { computed } from "vue";
const props = withDefaults(defineProps<FtLabelTypeProps>(), {
  isShowFontSize: true
});
const emit = defineEmits(FtLabelTypeEmits);
const { input, options, handleChange } = useSwLabelType(props, emit);
const selectStyle = computed(() => {
  if (isUndefined(props.selectWidth)) {
    return {
      width: props.isShowFontSize ? "calc(100% - 60px)" : "100%"
    };
  }
  return {
    width: `${props.selectWidth}px`
  };
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
