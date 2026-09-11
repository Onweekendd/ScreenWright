<template>
  <div class="front-exhibit-component" style="width: 100%; height: 100%">
    <component :is="getSlotsComponent(element.component.prop as ExhibitEnumType)" :element="element" />
  </div>
</template>
<script setup lang="ts">
import { useComponentSlot } from "@screenwright/composables";
import type { ExhibitEnumType } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

const componentMap = import.meta.glob("./*/index.vue", { eager: true });
const { getSlotsComponent } = useComponentSlot<ExhibitEnumType>(componentMap);
interface Props {
  element: ComponentType;
}

defineProps<Props>();
</script>
