<!-- 数据节点组件 -->
<template>
  <SwCollapseItem title="数据节点" open v-if="selectTargetData[0] && selectTargetData[0].option">
    <template #content>
      <el-form-item label="大小基数" :label-width="secondLabelWidth">
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.seriesLinksSymbolSize"
          :controls="false"
          :min="0"
          width="100%"
        />
      </el-form-item>
      <SwCollapseItem title="数值标签" open>
        <template #content>
          <!-- 偏移 -->
          <ItemConfigOffsetDis :label-width="thirdLabelWidth" />
        </template>
      </SwCollapseItem>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { secondLabelWidth, thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemConfigOffsetDis from "../../ItemComponent/ItemConfigOffsetDis/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>
