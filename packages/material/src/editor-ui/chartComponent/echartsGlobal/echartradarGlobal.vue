<template>
  <div class="echartradar-config">
    <configPieStyle :type="TypeAttrs.echartradar" :isShowBarCategoryGap="false" />
    <!-- 数值配置 -->
    <ItemPieRoseNumber />
    <!-- 图例配置 -->
    <ItemConfigLegend />
  </div>
</template>
<script setup lang="ts">
import configPieStyle from "../../components/configPieStyle/index.vue";
import { TypeAttrs } from "../../components/configPieStyle/useConfigPieStyle";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemPieRoseNumber from "../ItemComponent/ItemPieRoseNumber/index.vue";
</script>
