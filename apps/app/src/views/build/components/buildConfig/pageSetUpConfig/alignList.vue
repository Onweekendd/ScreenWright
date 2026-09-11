<template>
  <div class="flex align-list">
    <alignItem
      v-for="item in itemList"
      :key="item.type"
      :title="item.title"
      :type="item.type"
      :is-active="item.isActive"
      @click="itemClick(item)"
    />
  </div>
</template>
<script setup lang="ts">
import { toRef } from "vue";

import alignItem from "./alignItem.vue";
import type { Item } from "./useSetUpList";
import { useSetUpList } from "./useSetUpList";

interface Props {
  itemList: Array<Item>;
}
const props = defineProps<Props>();
const emits = defineEmits<{
  (event: "click", item: Item): void;
}>();

const { handleClick } = useSetUpList(toRef(props.itemList));
const itemClick = (item: Item) => {
  handleClick(item);
  emits("click", item);
};
</script>
<style lang="scss" scoped>
.align-list {
  width: 100%;
}
</style>
