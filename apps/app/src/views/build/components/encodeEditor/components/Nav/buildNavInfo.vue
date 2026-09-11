<template>
  <div :title="name" class="build-nav-info flex flex-align-center">
    <div class="logo">
      <img :src="BiLogo" />
    </div>
    <div class="info">
      <span>
        {{ name }}
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import BiLogo from "@/assets/image/bg/BI_logo.png";

interface Props {
  name: string;
}
defineProps<Props>();
</script>
<style lang="scss" scoped>
@import "@/views/build/style/buildNavInfo.scss";
</style>
