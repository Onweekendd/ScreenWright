<template>
  <div class="template-list">
    <div class="template-list-wrapper">
      <el-scrollbar style="width: 100%; height: 100%">
        <templateListContent />
      </el-scrollbar>
    </div>
  </div>
</template>
<script setup lang="ts">
import templateListContent from "./templateListContent.vue";
</script>
<style lang="scss" scoped>
.template-list {
  width: 100%;
  height: 100%;
  .template-list-wrapper {
    height: calc(100% - 54px);
  }
}
</style>
