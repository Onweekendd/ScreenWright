<template>
  <div class="text-ft-multi-line-animate">
    <sw-collapse-item title="动画" showIcon v-model="selectTargetData[0].option.scroll" @change="update">
      <template #content>
        <!-- 滚动速度 -->
        <TextScrollSpeed />
        <!-- 滚动方向 -->
        <TextScrollDirection />
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import TextScrollDirection from "./../../ItemComponent/ItemScrollDirection/index.vue";
import TextScrollSpeed from "./../../ItemComponent/ItemScrollSpeed/index.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
