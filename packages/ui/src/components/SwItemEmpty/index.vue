<template>
  <div class="default-content-item" :class="bgClass" />
</template>
<script setup lang="ts">
import { computed } from "vue"

interface Props {
  type?: "default" | "icon" | "upload"
}
const props = withDefaults(defineProps<Props>(), {
  type: "default"
})
const bgClass = computed(() => {
  return props.type
})
</script>
<style lang="scss" scoped>
.default-content-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-position: center;
  background-repeat: no-repeat;
  &.default {
    background: url("@/assets/image/bg/default_content_item.png");
    background-size: 100% 100%;
  }
  &.icon {
    background: url("@/assets/icon/assets-icon-modal.png") no-repeat;
    background-position: center;
  }
  &.upload {
    background: url("@/assets/image/assets-upload.png") no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }
}
</style>
