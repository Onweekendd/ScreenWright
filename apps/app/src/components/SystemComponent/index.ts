import type { Component } from "vue";

import { PanelEnum } from "@screenwright/types";

import ArtifactAppPreview from "./ArtifactAppPreview/index.vue";
import DynamicPanel from "./DynamicPanel/index.vue";
import EncodePanel from "./EncodePanel/index.vue";
import QuotePanel from "./QuotePanel/index.vue";

export const SystemComponentMap: Record<PanelEnum, Component> = {
  [PanelEnum.artifactAppPreview]: ArtifactAppPreview,
  [PanelEnum.dynamicPanel]: DynamicPanel,
  [PanelEnum.encodePanel]: EncodePanel,
  [PanelEnum.quotePanel]: QuotePanel
};
