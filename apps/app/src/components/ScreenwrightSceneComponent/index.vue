<template>
  <!-- <div>{{ element.component.prop }}</div> -->
  <component
    :is="getComponentByType(props.element.component.prop)"
    v-if="getComponentByType(props.element.component.prop)"
    :element="props.element"
  />
  <div v-else class="extendsComponent">未知组件类型: {{ element.component.prop }}</div>
</template>

<script setup lang="ts">
import type { defineAsyncComponent } from "vue";
import { computed } from "vue";

import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { SceneComponent } from "./useSceneComponents";
import { useScenesComponents } from "./useSceneComponents";

interface Props {
  element: ComponentType;
}

const props = defineProps<Props>();
console.log(props, "props");
const { componentList } = useScenesComponents();

const componentMap = computed(() => {
  const componentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {};

  componentList.value.forEach((item: SceneComponent) => {
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
