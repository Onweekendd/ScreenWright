<template>
  <div class="echartrank-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <el-form-item label="排序类型" :label-width="100">
      <sw-radio @change="update" direction="row" v-model="selectTargetData[0].option.sortType" :option="sortType" />
    </el-form-item>
    <!-- 条形样式配置 -->
    <ItemConfigStripStyle title="条形样式" :isStack="false" :isBarGap="false" isDefaultColor />
    <!-- 排名标签配置 -->
    <itemConfigNumIndexLabel :index="0" title="排名标签" type="none" isUpload />
    <!-- 类目标签配置 -->
    <itemConfigNumIndexLabel :index="1" title="类目标签" type="none" />
    <!-- 数值标签配置 -->
    <itemConfigNumIndexLabel :index="2" title="数值标签" type="custom-suffix" />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
    <!-- 滚动条配置 -->
    <ItemConfigDataZoom />
  </div>
</template>
<script setup lang="ts">
import { SwRadio } from "@screenwright/ui/radio";

import { useUpdateInstance } from "../../useUpdateInstance";
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDataZoom from "../ItemComponent/ItemConfigDataZoom/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import itemConfigNumIndexLabel from "../ItemComponent/itemConfigNumIndexLabel/index.vue";
import ItemConfigStripStyle from "../ItemComponent/ItemConfigStripStyle/index.vue";

const { update, selectTargetData } = useUpdateInstance();
const sortType = [
  { label: "降序", value: "desc" },
  { label: "升序", value: "asc" }
];
</script>
