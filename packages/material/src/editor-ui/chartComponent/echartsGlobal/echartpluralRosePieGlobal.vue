<template>
  <div class="echart-plural-rose-pie">
    <!-- 饼图样式Item组件 -->
    <ItemConfigPieStyle />
    <!-- echartpluralRosePie类型的数值标签 -->
    <ItemPieRoseNumber />
    <!-- echartpluralRosePie类型的图例标签 -->
    <ItemPieRoseLengend />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>
<script setup lang="ts">
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigPieStyle from "../ItemComponent/ItemConfigPieStyle/index.vue";
import ItemPieRoseLengend from "../ItemComponent/ItemPieRoseLengend/index.vue";
import ItemPieRoseNumber from "../ItemComponent/ItemPieRoseNumber/index.vue";
</script>
