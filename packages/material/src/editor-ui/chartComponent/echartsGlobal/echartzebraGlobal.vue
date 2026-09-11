<template>
  <div class="echart-zebra-global">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <ItemIsSort label="是否排序" :labelWidth="firstLabelWidth" />
    <ItemIsHighLight label="是否高亮" :labelWidth="firstLabelWidth" v-if="!selectTargetData[0].option.isSort" />
    <ItemBarStyle title="柱体样式" showBarColor />
  </div>
</template>

<script setup lang="ts">
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemBarStyle from "../ItemComponent/ItemBarStyle/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemIsHighLight from "../ItemComponent/ItemIsHighLight/index.vue";
import ItemIsSort from "../ItemComponent/ItemIsSort/index.vue";

const { selectTargetData } = useUpdateInstance();
</script>
