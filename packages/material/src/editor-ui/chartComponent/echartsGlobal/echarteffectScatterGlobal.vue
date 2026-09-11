<template>
  <div class="echart-effect-scatter-global">
    <!-- 边距组件 -->
    <ItemConfigDistance />
    <!-- 数据标记配置 -->
    <ItemecharteffectScatterDataMark />
    <!-- 波纹配置 -->
    <echarteffectScatterRipple />
  </div>
</template>

<script setup lang="ts">
import echarteffectScatterRipple from "../ItemComponent/echarteffectScatterRipple/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemecharteffectScatterDataMark from "../ItemComponent/ItemecharteffectScatterDataMark/index.vue";
</script>
