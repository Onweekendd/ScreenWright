<!-- 数据接口 -->
<template>
  <div class="data-interface">
    <div class="port-switch">数据接口</div>
    <dataInterfaceForm />
  </div>
</template>
<script setup lang="ts">
import dataInterfaceForm from "./dataInterfaceForm.vue";
</script>
<style lang="scss" scoped>
.data-interface {
  .port-switch {
    font-size: 12px;
    height: 30px;
    line-height: 30px;
    background-color: rgba(45, 47, 56, 0.8);
    color: #ffffff;
    padding-left: 16px;
    margin-bottom: 16px;
  }
}
</style>
