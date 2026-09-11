<template>
  <!-- 滚动条配置 -->
  <SwCollapseItem @change="update" v-model="selectTargetData[0].option.dataZoomShow" title="滚动条" showIcon>
    <template #content>
      <configDataZoom v-bind="$attrs" />
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configDataZoom from "../../../components/configDataZoom/index.vue";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
