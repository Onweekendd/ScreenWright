<template>
  <componentSearch :tabs="tabs" v-model="activeTab" @itemClick="componentClick" />
</template>

<script setup lang="ts">
import componentSearch from "@/components/componentSearch/index.vue";

import { useBuildComponentSearch } from "./useBuildComponentSearch";

interface Props {
  type?: "panel" | "render" | "encode";
}
const props = withDefaults(defineProps<Props>(), {
  type: "render"
});
const { tabs, activeTab, handleItemClick } = useBuildComponentSearch();

const componentClick = (item: any, active: string) => {
  handleItemClick(item, active, props.type);
};
</script>
