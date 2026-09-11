<template>
  <div class="echarts-config">
    <el-form class="echarts-config-form" label-width="90px" label-position="left">
      <configBaseAttrs />
      <configAttrsTab v-model="activeTab" :options="options" />
      <div class="echarts-config-wrapper">
        <component :is="renderComponent" />
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import configAttrsTab from "../components/configAttrsTab/index.vue";
import configBaseAttrs from "../components/configBaseAttrs/index.vue";
import { useAttrsRender } from "./useAttrsRender";

const { options, activeTab, renderComponent } = useAttrsRender();
</script>
<style lang="scss" scoped>
.echarts-config {
  height: 100%;
  .echarts-config-form {
    height: calc(100% - 144px);
    overflow: auto;
  }
  .echarts-config-wrapper {
    padding: 0 16px;
  }
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }
  :deep(.el-form-item__label) {
    padding: 0 !important;
    color: #b4b7c1 !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
  }
}
</style>
