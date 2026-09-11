<template>
  <div class="echartpie-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance :type="TypeAttrs.pie" />
    <!-- 饼图数值标签配置 -->
    <ItemPieConfigNumber />
    <!-- 饼图图例配置 -->
    <ItemPieConfigLegend />
  </div>
</template>
<script setup lang="ts">
import { TypeAttrs } from "../../components/configDistance/configDistance";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemPieConfigLegend from "../ItemComponent/ItemPieConfigLegend/index.vue";
import ItemPieConfigNumber from "../ItemComponent/ItemPieConfigNumber/index.vue";
</script>
