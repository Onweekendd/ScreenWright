<template>
  <div class="front-equipment-component">
    <component :is="getSlotsComponent(element.component.prop as EquipmentEnumType)" :element="element" />
  </div>
</template>
<script setup lang="ts">
import { useComponentSlot } from "@screenwright/composables";
import type { EquipmentEnumType } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

const componentMap = import.meta.glob("./*/index.vue", { eager: true });
const { getSlotsComponent } = useComponentSlot<EquipmentEnumType>(componentMap);
interface Props {
  element: ComponentType;
}

defineProps<Props>();
</script>
<style lang="scss" scoped>
.front-equipment-component {
  width: 100%;
  height: 100%;
}
</style>
