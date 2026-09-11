<template>
  <div class="echart-scale-pie-global">
    <ItemScalePieStyle />
    <ItemScaleStyle />
    <ItemPieConfigNumber :showSeriesLabelOrient="false" />
    <ItemScalePieLegend />
  </div>
</template>
<script setup lang="ts">
import ItemPieConfigNumber from "../ItemComponent/ItemPieConfigNumber/index.vue";
import ItemScalePieLegend from "../ItemComponent/ItemScalePieLegend/index.vue";
import ItemScalePieStyle from "../ItemComponent/ItemScalePieStyle/index.vue";
import ItemScaleStyle from "../ItemComponent/ItemScaleStyle/index.vue";
</script>
