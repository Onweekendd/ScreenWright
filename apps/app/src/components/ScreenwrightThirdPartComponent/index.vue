<template>
  <div class="front-equipment-component">
    <component :is="getSlotsComponent(element.component.prop as ThirdPartEnumType)" :element="element" />
  </div>
</template>
<script setup lang="ts">
import { useComponentSlot } from "@/hooks/useComponentSlot";
import type { ThirdPartEnumType } from "@/views/build/components/buildRender/core/ThirdParty/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

const componentMap = import.meta.glob("./*/index.vue", { eager: true });
const { getSlotsComponent } = useComponentSlot<ThirdPartEnumType>(componentMap);
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
