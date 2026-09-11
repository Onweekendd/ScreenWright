<template>
  <div class="echartfunnelSeries">
    <ItemSeries type="single" />
  </div>
</template>

<script setup lang="ts">
import ItemSeries from "../ItemComponent/ItemSeries/index.vue";
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
