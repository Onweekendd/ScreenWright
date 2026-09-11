<template>
  <div class="echarttreemap-config">
    <!-- 主项间隔边框 -->
    <distanceConfig title="主项间隔边框" :type="TypeAttrs.parent" />
    <!-- 子项间隔边框 -->
    <distanceConfig title="子项间隔边框" :type="TypeAttrs.children" />
    <!-- 图形样式组件 -->
    <ItemGraphStyle />
  </div>
</template>
<script setup lang="ts">
import distanceConfig from "../ItemComponent/ItemDistanceConfig/index.vue";
import ItemGraphStyle from "../ItemComponent/ItemGraphStyle/index.vue";
import { TypeAttrs } from "../useDistanceConfig";
</script>
