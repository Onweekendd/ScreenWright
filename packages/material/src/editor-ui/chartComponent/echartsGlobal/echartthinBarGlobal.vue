<!-- 细长柱状图全局配置 -->
<template>
  <div>
    <ItemConfigDistance />
    <ItemIsSort label="是否排序" :labelWidth="firstLabelWidth" />
    <ItemIsHighLight label="是否高亮" :labelWidth="firstLabelWidth" v-if="!selectTargetData[0].option.isSort" />
    <ItemechartthinBarBarStyle title="柱体样式" />
  </div>
</template>

<script setup lang="ts">
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemechartthinBarBarStyle from "../ItemComponent/ItemechartthinBarBarStyle/index.vue";
import ItemIsHighLight from "../ItemComponent/ItemIsHighLight/index.vue";
import ItemIsSort from "../ItemComponent/ItemIsSort/index.vue";
const { selectTargetData } = useUpdateInstance();
</script>
