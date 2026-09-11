<template>
  <gridItem>
    <div
      class="template-item content__info"
      :class="{ 'is-default': item.type === 1, 'is-multi': item.type === 2, 'is-template': item.type === 3 }"
    >
      <img :src="setMinioUrl(item.backgroundUrl)" v-if="item.backgroundUrl" />
      <SwItemEmpty v-else />
      <templateMenu :item="item" :permissionMap="permissionMap" />
    </div>
    <div class="content__main">
      <span class="content__name">{{ item.name }}</span>
    </div>
  </gridItem>
</template>
<script setup lang="ts">
import SwItemEmpty from "@/components/SwItemEmpty/index.vue";
import type { ScreenItem } from "@/model/Visual";
import { setMinioUrl } from "@/utils/config";

import gridItem from "../grid/grid-item.vue";
import templateMenu from "./templateMenu.vue";

defineProps<{
  item: ScreenItem;
  permissionMap: Map<any, any>;
}>();
</script>
<style lang="scss" scoped>
@import "../style/templateItem.scss";
</style>
