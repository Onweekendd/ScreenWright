<template>
  <div
    v-if="visible"
    class="build-edit-input"
    :style="positionStyle"
    style="width: 100px; height: 36px"
    ref="editInputRef"
  >
    <el-input
      @keyup.enter="handleSave"
      v-model="inputValue"
      placeholder="请输入内容"
      ref="inputRef"
      @change="handleInputChange"
      autofocus
    />
  </div>
</template>
<script setup lang="ts">
import { useEdit } from "./useEdit";

const { positionStyle, inputValue, visible, inputRef, editInputRef, handleInputChange, handleSave } = useEdit();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.build-edit-input {
  position: absolute;
  top: 0;
  left: 0;
  @include common-element-style(".el-input__wrapper");
}
</style>
