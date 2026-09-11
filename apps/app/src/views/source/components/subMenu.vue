<template>
  <div class="subtitle-menu flex">
    <div
      class="menu-item"
      :class="{ 'menu-active': item.value === menuActive }"
      v-for="item in tabsList"
      :key="item.value"
      @click="handleClick(item)"
    >
      {{ item.name }}
    </div>
  </div>
</template>
<script setup lang="ts">
interface Props {
  tabsList: Array<{ value: string; name: string }>;
  menuActive: string;
}
defineProps<Props>();
const emits = defineEmits(["click"]);
const handleClick = (item: { value: string; name: string }) => {
  emits("click", item);
};
</script>
<style lang="scss" scoped>
@import "../style/subMenu.scss";
</style>
