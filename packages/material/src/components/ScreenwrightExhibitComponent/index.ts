import { ExhibitEnum } from "@screenwright/types";
import type { Component } from "vue";

import ftFilter from "./ftFilter/index.vue";
import ftParticles from "./ftParticles/index.vue";
import imagesList3d from "./imagesList3d/index.vue";
import ringIndicator3d from "./ringIndicator3d/index.vue";
import ringIndicator3dNew from "./ringIndicator3dNew/index.vue";

export const ScreenwrightExhibitComponentMap: Record<ExhibitEnum, Component> = {
  [ExhibitEnum.RingIndicator3d]: ringIndicator3d,
  [ExhibitEnum.ringIndicator3dNew]: ringIndicator3dNew,
  [ExhibitEnum.ImagesList3d]: imagesList3d,
  [ExhibitEnum.FtParticles]: ftParticles,
  [ExhibitEnum.FtFilter]: ftFilter,
};
