<template>
  <div class="inputBox" :style="ftStyle">
    <el-input
      v-model="input"
      @focus="handleFocus"
      @blur="handleBlur"
      @input="handleInput"
      @change="handleChange"
      @clear="handleClear"
      ref="elInputRef"
      v-bind="omitProps"
    >
      <template #prefix>
        <div class="unit">
          {{ unit }}
        </div>
      </template>
    </el-input>
    <div class="bottomLabel" v-if="bottomLabel && bottomLabel.length > 0">
      {{ bottomLabel }}
    </div>
  </div>
</template>
<script setup lang="ts">
// @ts-nocheck
import type { FtInputProps } from "./input";
import { FtInputEmits } from "./input";
import { useSwInput } from "./useSwInput";
import { nextTick, ref } from "vue";
defineOptions({
  name: "SwInput",
  inheritAttrs: true
});

const props = defineProps<FtInputProps>();
const emit = defineEmits(FtInputEmits);
const elInputRef = ref();
const focus = async () => {
  await nextTick();
  if (elInputRef.value) {
    elInputRef.value.focus();
  }
};

const { input, ftStyle, omitProps, cHeight, handleInput, handleClear, handleBlur, handleFocus, handleChange } =
  useSwInput(props, emit);
defineExpose({
  focus
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.inputBox {
  position: relative;
  @include common-element-style(".el-input__wrapper", true, true);
  @include common-element-style(".el-textarea__inner", true, true);
  :deep(.el-input) {
    --el-input-height: v-bind("cHeight") !important;
  }
  .bottomLabel {
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-size: 12px;
    font-weight: 400;
    color: #b4b7c1;
    text-align: center;
    line-height: 18px;
  }
  :deep(.el-input__wrapper) {
    font-size: 12px;
    padding-left: 5px;
    padding-right: 5px;
  }
}
</style>
