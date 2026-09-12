import { ExtendsChildComponentEnum, ExtendsEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出 extendsEnum，保持本地命名
export { ExtendsEnum as extendsEnumType };

export enum ueStreamType {
  UePeerStreaming = "ue-peer-streaming",
  UeVessel = "ue-vessel",
  UePixelStreaming = "ue-pixel-streaming",
  FtUnrealEngine = "sw-unreal-engine"
}

// 从 @screenwright/types 重新导出 extendsChildComponentEnum，保持本地命名
export { ExtendsChildComponentEnum as extendsChildComponentEnumType };

export const extendsComponentType: ExtendsEnum[] = [
  ExtendsEnum.UePeerStreaming,
  ExtendsEnum.UeVessel,
  ExtendsEnum.UePixelStreaming,
  ExtendsEnum.FtUnrealEngine,
  ExtendsEnum.FtDigitalHuman,
  ExtendsEnum.SimpleStar,
  ExtendsEnum.FullScreenSwitch,
  ExtendsEnum.PageReload,
  ExtendsEnum.SimpleParticle,
  ExtendsEnum.SimpleBarrage,
  ExtendsEnum.FtDataContainer,
  ExtendsEnum.FtWeather,
  ExtendsEnum.FtMaskLayer
];

export const childComponentType: ExtendsChildComponentEnum[] = [ExtendsChildComponentEnum.UeVessel_UeMessageReceiver];
