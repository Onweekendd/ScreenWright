<!-- 数据配置的tab -->
<template>
  <div class="data-config">
    <dataConfigRemark />
    <dataInterface />
  </div>
</template>
<script setup lang="ts">
import dataConfigRemark from "./components/dataConfigRemark.vue";
import dataInterface from "./components/dataInterface.vue";
</script>

<style lang="scss" scoped>
.data-config {
  width: 100%;
  height: calc(100% - 67px - 50px);
  overflow: scroll;
  overflow-x: hidden;
  padding-bottom: 10px;
}
</style>
