<template>
  <div class="echart-loop-ring-pie-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance :type="TypeAttrs.pie" />
    <!-- 饼图图例配置 -->
    <ItemPieConfigLegend />
  </div>
</template>
<script setup lang="ts">
import { TypeAttrs } from "../../components/configDistance/configDistance";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemPieConfigLegend from "../ItemComponent/ItemPieConfigLegend/index.vue";
</script>
