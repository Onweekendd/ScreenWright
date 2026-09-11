<template>
  <div class="echart-graph-config">
    <!-- 数据节点组件 -->
    <dataNode />
    <!-- 数据路线组件 -->
    <dataLine />
  </div>
</template>
<script setup lang="ts">
import dataLine from "../ItemComponent/ItemDataLine/index.vue";
import dataNode from "../ItemComponent/ItemDataNode/index.vue";
</script>
