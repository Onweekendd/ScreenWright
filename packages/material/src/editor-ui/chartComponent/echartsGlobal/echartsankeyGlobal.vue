<template>
  <div class="echartsankey-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance :type="TypeAttrs.pie" />
    <!-- 全局配置 -->
    <ItemEchartsankeyGlobal />
    <!-- 数值标签 -->
    <ItemEchartsankeyNumber />
    <!-- 线配置 -->
    <ItemechartsankeyLine />
    <!-- 提示框 -->
    <ItemEchartsankeyToolTip />
  </div>
</template>
<script setup lang="ts">
import { TypeAttrs } from "../../components/configDistance/configDistance";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemEchartsankeyGlobal from "../ItemComponent/ItemechartsankeyGlobal/index.vue";
import ItemechartsankeyLine from "../ItemComponent/ItemechartsankeyLine/index.vue";
import ItemEchartsankeyNumber from "../ItemComponent/ItemEchartsankeyNumber/index.vue";
import ItemEchartsankeyToolTip from "../ItemComponent/ItemEchartsankeyToolTip/index.vue";
</script>
