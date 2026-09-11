<template>
  <el-button
    type="primary"
    size="small"
    class="fly-line-editor-entry-button"
    :disabled="!canOpen"
    @click="handleOpenFlyLineEditor"
  >
    进入飞线编辑
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

const handleOpenFlyLineEditor = () => {
  const parentId = currentParentItem.value?.id;
  const currentId = currentChildrenItem.value?.id;
  if (!canOpen.value || !parentId || !currentId) {
    return;
  }

  router.push({
    name: "glFlyLine",
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
.fly-line-editor-entry-button {
  min-width: 96px;
  border: none !important;
  background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%) !important;
  box-shadow: 0 6px 16px rgba(100, 44, 255, 0.22);
}

.fly-line-editor-entry-button:hover,
.fly-line-editor-entry-button:focus {
  background: linear-gradient(180deg, #9665ef 0%, #7241ff 100%) !important;
}

.fly-line-editor-entry-button.is-disabled,
.fly-line-editor-entry-button.is-disabled:hover {
  background: linear-gradient(180deg, rgba(123, 97, 209, 0.72) 0%, rgba(90, 55, 179, 0.72) 100%) !important;
  box-shadow: none;
}
</style>
