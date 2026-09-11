<template>
  <div class="echartscatter-config">
    <ItemConfigDistance />
    <!-- 是否留白 -->
    <ItemConfigGap />
    <!-- 图例配置 -->
    <ItemConfigLegend />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>
<script setup lang="ts">
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigGap from "../ItemComponent/ItemConfigGap/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
</script>
