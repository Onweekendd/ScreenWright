<template>
  <el-button
    type="primary"
    size="small"
    class="point-editor-entry-button"
    :disabled="!canOpen"
    @click="handleOpenPointEditor"
  >
    进入点位编辑
  </el-button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useChildrenDrawer } from "../useChildrenDrawer";

const route = useRoute();
const router = useRouter();
const { currentChildrenItem, currentParentItem } = useChildrenDrawer();

const canOpen = computed(() => {
  return Boolean(route.params.id && currentParentItem.value?.id && currentChildrenItem.value?.id);
});

const handleOpenPointEditor = () => {
  const parentId = currentParentItem.value?.id;
  const currentId = currentChildrenItem.value?.id;
  if (!canOpen.value || !parentId || !currentId) {
    return;
  }

  router.push({
    name: "glPoint",
    params: {
      id: route.params.id,
      cid: parentId
    },
    query: {
      childId: currentId
    }
  });
};
</script>

<style scoped lang="scss">
.point-editor-entry-button {
  min-width: 96px;
  border: none !important;
  background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%) !important;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--sw-theme-color) 22%, transparent);
}

.point-editor-entry-button:hover,
.point-editor-entry-button:focus {
  background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%) !important;
}

.point-editor-entry-button.is-disabled,
.point-editor-entry-button.is-disabled:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--sw-theme-color) 72%, transparent) 0%, color-mix(in srgb, var(--sw-theme-color) 72%, transparent) 100%) !important;
  box-shadow: none;
}
</style>
