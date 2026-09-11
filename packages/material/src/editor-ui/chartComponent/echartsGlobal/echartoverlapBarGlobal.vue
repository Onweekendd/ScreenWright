<template>
  <div class="echart-overlap-bar-global">
    <!-- 边距组件 -->
    <ItemConfigDistance />

    <!-- 轴标签配置 -->
    <ItemAxisLabel :showLabelWidth="false" />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
    <!-- 网格线 -->
    <ItemxAxisSplitLine />
  </div>
</template>
<script setup lang="ts">
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemAxisLabel from "../ItemComponent/ItemechartmultiplyRankBarAxisLabel/index.vue";
import ItemxAxisSplitLine from "../ItemComponent/ItemxAxisSplitLine/index.vue";
</script>
