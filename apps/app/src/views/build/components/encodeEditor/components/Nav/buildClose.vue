<template>
  <div class="build-close flex flex-center" @click="close">
    <Icon type="iconfont-fanhuichexiao" size="18" />
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

const emits = defineEmits(["close"]);
const close = () => {
  emits("close");
};
</script>
<style lang="scss" scoped>
@import "src/style/theme.scss";
.build-close {
  width: 46px;
  height: 46px;
  box-sizing: border-box;
  background-color: $sw-surface-2;
  border: 1px solid $sw-border;
  border-radius: 8px;
  color: $sw-text-dim;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s,
    border-color 0.15s;
  &:hover {
    background-color: rgba(245, 108, 108, 0.12);
    border-color: rgba(245, 108, 108, 0.4);
    color: #f56c6c;
  }
}
</style>
