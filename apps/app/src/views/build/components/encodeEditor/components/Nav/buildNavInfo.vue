<template>
  <div :title="name" class="build-nav-info flex flex-align-center">
    <div class="info">
      <span>
        {{ name }}
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
interface Props {
  name: string;
}
defineProps<Props>();
</script>
<style lang="scss" scoped>
@import "@/views/build/style/buildNavInfo.scss";
</style>
