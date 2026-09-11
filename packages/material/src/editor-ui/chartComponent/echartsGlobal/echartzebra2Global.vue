<template>
  <div class="echartzebra2Global">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 柱状样式 -->
    <ItemZebra2BarStyle />
    <!-- 图例配置 -->
    <ItemConfigLegend :isShowLegendSelectedMode="false" />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>

<script setup lang="ts">
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemZebra2BarStyle from "../ItemComponent/ItemZebra2BarStyle/index.vue";
</script>
