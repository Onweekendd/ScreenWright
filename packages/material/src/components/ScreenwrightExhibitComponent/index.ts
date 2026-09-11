import { ExhibitEnum } from "@screenwright/types";
import type { Component } from "vue";

import CurvedTrackList from "./CurvedTrackList/index.vue";
import ftCarouselImageV2 from "./ftCarouselImageV2/index.vue";
import ftFilter from "./ftFilter/index.vue";
import ftFlexDecoration from "./ftFlexDecoration/index.vue";
import ftNinePatch from "./ftNinePatch/index.vue";
import ftParticles from "./ftParticles/index.vue";
import ftQachat from "./ftQachat/index.vue";
import ftRotate from "./ftRotate/index.vue";
import ftRotateCube from "./ftRotateCube/index.vue";
import ftSignaturePad from "./ftSignaturePad/index.vue";
import ftSlidecardV1 from "./ftSlidecardV1/index.vue";
import ftTranslation from "./ftTranslation/index.vue";
import ftTurnPage from "./ftTurnPage/index.vue";
import imagesList3d from "./imagesList3d/index.vue";
import pdfjsViewer from "./pdfjsViewer/index.vue";
import ringIndicator3d from "./ringIndicator3d/index.vue";
import ringIndicator3dNew from "./ringIndicator3dNew/index.vue";
import verticalCard from "./verticalCard/index.vue";

export const ScreenwrightExhibitComponentMap: Record<ExhibitEnum, Component> = {
  [ExhibitEnum.RingIndicator3d]: ringIndicator3d,
  [ExhibitEnum.ringIndicator3dNew]: ringIndicator3dNew,
  [ExhibitEnum.FtSlidecardV1]: ftSlidecardV1,
  [ExhibitEnum.ImagesList3d]: imagesList3d,
  [ExhibitEnum.FtQachat]: ftQachat,
  [ExhibitEnum.PdfjsViewer]: pdfjsViewer,
  [ExhibitEnum.FtParticles]: ftParticles,
  [ExhibitEnum.FtRotateCube]: ftRotateCube,
  [ExhibitEnum.FtSignaturePad]: ftSignaturePad,
  [ExhibitEnum.CurvedTrackList]: CurvedTrackList,
  [ExhibitEnum.FtTranslation]: ftTranslation,
  [ExhibitEnum.FtCarouselImageV2]: ftCarouselImageV2,
  [ExhibitEnum.FtTurnPage]: ftTurnPage,
  [ExhibitEnum.FtFilter]: ftFilter,
  [ExhibitEnum.FtFlexDecoration]: ftFlexDecoration,
  [ExhibitEnum.FtNinePatch]: ftNinePatch,
  [ExhibitEnum.verticalCard]: verticalCard,
  [ExhibitEnum.FtRotate]: ftRotate,
};
