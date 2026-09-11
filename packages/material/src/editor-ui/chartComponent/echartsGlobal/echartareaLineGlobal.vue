<template>
  <div class="echartarea-line-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <el-form-item label="是否留白" style="margin-left: 10px">
      <el-checkbox v-model="selectTargetData[0].option.boundaryGap" style="margin-left: 2px" @change="update" />
    </el-form-item>
    <!-- 图例配置 -->
    <ItemConfigLegend />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>
<script setup lang="ts">
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
