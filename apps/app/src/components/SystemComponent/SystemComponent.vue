<script setup lang="ts">
import type { Component } from "vue";

import type { ComponentType, PanelEnum } from "@screenwright/types";

import ArtifactAppPreview from "@/components/SystemComponent/ArtifactAppPreview/index.vue";
import DynamicPanel from "@/components/SystemComponent/DynamicPanel/index.vue";
import EncodePanel from "@/components/SystemComponent/EncodePanel/index.vue";
import QuotePanel from "@/components/SystemComponent/QuotePanel/index.vue";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";

const componentName2Component: Record<PanelType, Component> = {
  [PanelType.artifactAppPreview]: ArtifactAppPreview,
  [PanelType.dynamicPanel]: DynamicPanel,
  [PanelType.encodePanel]: EncodePanel,
  [PanelType.quotePanel]: QuotePanel
} as const;

const props = defineProps<{
  element: ComponentType<PanelEnum>;
}>();
</script>

<template>
  <component :is="componentName2Component[element.component.prop]" :element="props.element" :is-active="false" />
</template>
