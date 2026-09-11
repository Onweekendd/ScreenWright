<template>
  <div class="page-set-up-header flex flex-center">
    <Icon type="iconfont-yemianshezhi" size="18" />
    <div class="title-content">
      <div class="title-setup">页面设置</div>
      <div class="title-english">pagesetup</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";
</script>
<style lang="scss" scoped>
.page-set-up-header {
  height: 36px;
  color: #ffffff;
  border-radius: 0;
  background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
  font-size: 12px;
  .title-content {
    line-height: 8px;
    margin-left: 8px;
    text-align: left;
  }
  .title-english {
    position: relative;
    left: -12px;
    top: 2px;
    transform: scale(0.6);
  }
}
</style>
