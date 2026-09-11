<template>
  <component
    :is="getComponentByType(props.element.component.prop)"
    v-if="getComponentByType(props.element.component.prop)"
    :element="props.element"
  />
  <div v-else class="extendsComponent">未知组件类型: {{ props.element }}</div>
</template>

<script setup lang="ts">
import type { defineAsyncComponent } from "vue";
import { computed } from "vue";

import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { ExtendComponent } from "./useExtendsComponents";
import { useExtendsComponents } from "./useExtendsComponents";

interface Props {
  element: ComponentType;
}

const props = defineProps<Props>();
const { componentList } = useExtendsComponents();

const componentMap = computed(() => {
  const componentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {};

  componentList.value.forEach((item: ExtendComponent) => {
    componentMap[item.name] = item.component;
  });
  return componentMap;
});

const getComponentByType = (prop: string) => {
  return componentMap.value[prop] || null;
};
</script>

<style>
.extendsComponent {
  color: aliceblue;
  font-size: 20px;
}
</style>
