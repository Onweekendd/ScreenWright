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
      <div class="content__menulist">
        <span
          class="content__status"
          :class="{
            'content__status--active color-purple': item.status
          }"
        >
          {{ getStatusName(item.status) }}
        </span>
      </div>
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
const getStatusName = (status: boolean | null) => {
  return status ? "已发布" : "未发布";
};
</script>
<style lang="scss" scoped>
.color-purple {
  color: #9483ff !important;
}

@import "../style/templateItem.scss";
</style>
