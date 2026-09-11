import { ExhibitEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出 ExhibitEnum，保持本地命名
export { ExhibitEnum as ExhibitEnumType };

export const exhibitComponentType: ExhibitEnum[] = [
  ExhibitEnum.ringIndicator3dNew,
  ExhibitEnum.RingIndicator3d,
  ExhibitEnum.FtSlidecardV1,
  ExhibitEnum.ImagesList3d,
  ExhibitEnum.CurvedTrackList,
  ExhibitEnum.FtQachat,
  ExhibitEnum.PdfjsViewer,
  ExhibitEnum.FtParticles,
  ExhibitEnum.FtRotateCube,
  ExhibitEnum.FtSignaturePad,
  ExhibitEnum.FtTranslation,
  ExhibitEnum.FtCarouselImageV2,
  ExhibitEnum.FtTurnPage,
  ExhibitEnum.FtFilter,
  ExhibitEnum.FtFlexDecoration,
  ExhibitEnum.FtNinePatch,
  ExhibitEnum.verticalCard,
  ExhibitEnum.FtRotate
];
