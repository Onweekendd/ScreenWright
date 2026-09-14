import { ExhibitEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出 ExhibitEnum，保持本地命名
export { ExhibitEnum as ExhibitEnumType };

export const exhibitComponentType: ExhibitEnum[] = [
  ExhibitEnum.ringIndicator3dNew,
  ExhibitEnum.RingIndicator3d,
  ExhibitEnum.ImagesList3d,
  ExhibitEnum.FtParticles,
  ExhibitEnum.FtFilter,
];
