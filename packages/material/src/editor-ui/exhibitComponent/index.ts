import type { Component } from "vue";

import { ExhibitEnum } from "@screenwright/types";

import ftParticlesAnimation from "./exhibitAnimation/ft-particlesAnimation.vue";
import imagesList3dBaseMap from "./exhibitBaseMap/imagesList3dBaseMap.vue";
import ftSignaturePadControl from "./exhibitControl/ft-signaturePadControl.vue";
import ftSignaturePadEdit from "./exhibitEdit/ft-signaturePadEdit.vue";
import ftFilterFilter from "./exhibitFilter/ft-filterFilter.vue";
import ftFilterGlobal from "./exhibitGlobal/ft-filterGlobal.vue";
import ftParticlesGlobal from "./exhibitGlobal/ft-particlesGlobal.vue";
import ftSignaturePadGlobal from "./exhibitGlobal/ft-signaturePadGlobal.vue";
import imagesList3dGlobal from "./exhibitGlobal/imagesList3dGlobal.vue";
import pdfjsViewerGlobal from "./exhibitGlobal/pdfjs-viewerGlobal.vue";
import ringIndicator3dGlobal from "./exhibitGlobal/ringIndicator3dGlobal.vue";
import ringIndicator3dNewGlobal from "./exhibitGlobal/ringIndicator3dNewGlobal.vue";
import verticalCardGlobal from "./exhibitGlobal/verticalCardGlobal.vue";
import ftParticlesInteractive from "./exhibitInteractive/ft-particlesInteractive.vue";
import ftParticlesLineOption from "./exhibitLineOption/ft-particlesLineOption.vue";
import imagesList3dPicList from "./exhibitPicList/imagesList3dPicList.vue";
import verticalCardPicList from "./exhibitPicList/verticalCardPicList.vue";
import ringIndicator3dNewSign from "./exhibitSign/ringIndicator3dNewSign.vue";
import ringIndicator3dSign from "./exhibitSign/ringIndicator3dSign.vue";

export enum optionType {
  global = "Global",
  sign = "Sign",
  baseMap = "BaseMap",
  picList = "PicList",
  edit = "Edit",
  control = "Control",
  dic = "Dic",
  filter = "Filter",
  lineOption = "LineOption",
  animation = "Animation",
  interactive = "Interactive",
  style = "Style",
  picture = "Picture"
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
  /** 该 Tab 在编辑器中是否隐藏 */
  hidden?: boolean;
};

export const ExhibitConfigComponent: Partial<Record<ExhibitEnum, ConfigTab[]>> = {
  [ExhibitEnum.RingIndicator3d]: [
    { label: "全局", value: optionType.global, component: ringIndicator3dGlobal },
    { label: "标牌", value: optionType.sign, component: ringIndicator3dSign }
  ],
  [ExhibitEnum.ringIndicator3dNew]: [
    { label: "全局", value: optionType.global, component: ringIndicator3dNewGlobal },
    { label: "标牌", value: optionType.sign, component: ringIndicator3dNewSign }
  ],
  [ExhibitEnum.ImagesList3d]: [
    { label: "全局", value: optionType.global, component: imagesList3dGlobal },
    { label: "底图", value: optionType.baseMap, component: imagesList3dBaseMap },
    { label: "图片列表", value: optionType.picList, component: imagesList3dPicList }
  ],
  [ExhibitEnum.PdfjsViewer]: [
    { label: "全局", value: optionType.global, component: pdfjsViewerGlobal }
  ],
  [ExhibitEnum.FtParticles]: [
    { label: "基础配置", value: optionType.global, component: ftParticlesGlobal },
    { label: "连线配置", value: optionType.lineOption, component: ftParticlesLineOption },
    { label: "动画配置", value: optionType.animation, component: ftParticlesAnimation },
    { label: "交互配置", value: optionType.interactive, component: ftParticlesInteractive }
  ],
  [ExhibitEnum.FtSignaturePad]: [
    { label: "基础配置", value: optionType.global, component: ftSignaturePadGlobal },
    { label: "操作控制", value: optionType.edit, component: ftSignaturePadEdit },
    { label: "配置控制", value: optionType.control, component: ftSignaturePadControl }
  ],
  [ExhibitEnum.FtFilter]: [
    { label: "全局", value: optionType.global, component: ftFilterGlobal },
    { label: "滤镜", value: optionType.filter, component: ftFilterFilter }
  ],
  [ExhibitEnum.verticalCard]: [
    { label: "全局", value: optionType.global, component: verticalCardGlobal },
    { label: "图片列表", value: optionType.picList, component: verticalCardPicList }
  ]
};
