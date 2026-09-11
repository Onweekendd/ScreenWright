<!-- 处理 echartbothWayStripBar 类型图表的配置 -->
<template>
  <div class="echartboth-way-stripBar-config">
    <!-- 边距组件配置 -->
    <el-form-item label="边距" label-width="100">
      <div class="echartboth-way-stripBa-distance flex flex-justify-between" v-if="selectTargetData[0].option">
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.gridTop"
          width="50%"
          unit="%"
          bottom-label="上"
        />
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.gridBottom"
          width="50%"
          unit="%"
          bottom-label="下"
        />
      </div>
    </el-form-item>
    <!-- 条形样式配置 -->
    <ItemConfigStripStyle :isBarGap="false" :isStack="false" title="条形样式" />
    <!-- 图例配置 -->
    <ItemConfigLegend />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../useUpdateInstance";
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemConfigStripStyle from "../ItemComponent/ItemConfigStripStyle/index.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
