<template>
  <div class="echartpictorial-bar-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 柱间样式配置 -->
    <ItemConfigBarPic />
    <!-- 数值标签配置 -->
    <ItemConfigNumber type="custom-text" />
    <!-- 图例配置 -->
    <ItemConfigLegend />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>
<script setup lang="ts">
import ItemConfigBarPic from "../ItemComponent/ItemConfigBarPic/index.vue";
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemConfigNumber from "../ItemComponent/ItemConfigNumber/index.vue";
</script>
