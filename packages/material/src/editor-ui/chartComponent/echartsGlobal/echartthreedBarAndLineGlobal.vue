<template>
  <div class="echart-threed-bar-and-line-global">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 是否排序 -->
    <!-- <ItemIsSort label="是否排序" :labelWidth="firstLabelWidth" /> -->
    <!-- 高亮组件配置 -->
    <ItemBarAndLineHighLight />
    <!-- 柱状样式组件配置 -->
    <ItemthreeDBarColor showBarColor />
    <!-- 折线样式组件配置 -->
    <ItemLineStyle />
    <!-- 图例组件配置 -->
    <ItemConfigLegend :showLegendSize="false" />
  </div>
</template>
<script setup lang="ts">
// import { firstLabelWidth } from "../../constants"
// import ItemIsSort from "../ItemComponent/ItemIsSort/index.vue"
import ItemBarAndLineHighLight from "../ItemComponent/ItemBarAndLineHighLight/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemLineStyle from "../ItemComponent/ItemLineStyle/index.vue";
import ItemthreeDBarColor from "../ItemComponent/ItemthreeDBarColor/index.vue";
</script>
