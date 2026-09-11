import type { Component } from "vue";

import { ExhibitEnum } from "@screenwright/types";

import ftParticlesAnimation from "./exhibitAnimation/ft-particlesAnimation.vue";
import ftRotateCubeAnimation from "./exhibitAnimation/ft-rotateCubeAnimation.vue";
import imagesList3dBaseMap from "./exhibitBaseMap/imagesList3dBaseMap.vue";
import ftSignaturePadControl from "./exhibitControl/ft-signaturePadControl.vue";
import ftTranslationDic from "./exhibitDic/ft-translationDic.vue";
import ftSignaturePadEdit from "./exhibitEdit/ft-signaturePadEdit.vue";
import ftFilterFilter from "./exhibitFilter/ft-filterFilter.vue";
import CurvedTrackListGlobal from "./exhibitGlobal/CurvedTrackListGlobal.vue";
import ftCarouselImageV2Global from "./exhibitGlobal/ft-carousel-image-v2Global.vue";
import ftFilterGlobal from "./exhibitGlobal/ft-filterGlobal.vue";
import ftFlexDecorationGlobal from "./exhibitGlobal/ft-flex-decorationGlobal.vue";
import ftNinePatchGlobal from "./exhibitGlobal/ft-nine-patchGlobal.vue";
import ftParticlesGlobal from "./exhibitGlobal/ft-particlesGlobal.vue";
import ftQachatGlobal from "./exhibitGlobal/ft-qachatGlobal.vue";
import ftRotateCubeGlobal from "./exhibitGlobal/ft-rotateCubeGlobal.vue";
import ftRotateGlobal from "./exhibitGlobal/ft-rotateGlobal.vue";
import ftSignaturePadGlobal from "./exhibitGlobal/ft-signaturePadGlobal.vue";
import ftSlidecardV1Global from "./exhibitGlobal/ft-slidecard-v1Global.vue";
import ftTranslationGlobal from "./exhibitGlobal/ft-translationGlobal.vue";
import ftTurnPageGlobal from "./exhibitGlobal/ft-turn-pageGlobal.vue";
import imagesList3dGlobal from "./exhibitGlobal/imagesList3dGlobal.vue";
import pdfjsViewerGlobal from "./exhibitGlobal/pdfjs-viewerGlobal.vue";
import ringIndicator3dGlobal from "./exhibitGlobal/ringIndicator3dGlobal.vue";
import ringIndicator3dNewGlobal from "./exhibitGlobal/ringIndicator3dNewGlobal.vue";
import verticalCardGlobal from "./exhibitGlobal/verticalCardGlobal.vue";
import ftParticlesInteractive from "./exhibitInteractive/ft-particlesInteractive.vue";
import ftParticlesLineOption from "./exhibitLineOption/ft-particlesLineOption.vue";
import CurvedTrackListPicList from "./exhibitPicList/CurvedTrackListPicList.vue";
import ftCarouselImageV2PicList from "./exhibitPicList/ft-carousel-image-v2PicList.vue";
import imagesList3dPicList from "./exhibitPicList/imagesList3dPicList.vue";
import verticalCardPicList from "./exhibitPicList/verticalCardPicList.vue";
import ftRotateCubePicture from "./exhibitPicture/ft-rotateCubePicture.vue";
import ringIndicator3dNewSign from "./exhibitSign/ringIndicator3dNewSign.vue";
import ringIndicator3dSign from "./exhibitSign/ringIndicator3dSign.vue";
import ftRotateCubeStyle from "./exhibitStyle/ft-rotateCubeStyle.vue";

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
  /** 该 Tab 在编辑器中是否隐藏（如 FtSlidecardV1 无需显示全局 Tab） */
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
  [ExhibitEnum.CurvedTrackList]: [
    { label: "全局", value: optionType.global, component: CurvedTrackListGlobal },
    { label: "图片列表", value: optionType.picList, component: CurvedTrackListPicList }
  ],
  [ExhibitEnum.ImagesList3d]: [
    { label: "全局", value: optionType.global, component: imagesList3dGlobal },
    { label: "底图", value: optionType.baseMap, component: imagesList3dBaseMap },
    { label: "图片列表", value: optionType.picList, component: imagesList3dPicList }
  ],
  [ExhibitEnum.FtQachat]: [{ label: "全局", value: optionType.global, component: ftQachatGlobal }],
  [ExhibitEnum.PdfjsViewer]: [
    { label: "全局", value: optionType.global, component: pdfjsViewerGlobal }
  ],
  [ExhibitEnum.FtParticles]: [
    { label: "基础配置", value: optionType.global, component: ftParticlesGlobal },
    { label: "连线配置", value: optionType.lineOption, component: ftParticlesLineOption },
    { label: "动画配置", value: optionType.animation, component: ftParticlesAnimation },
    { label: "交互配置", value: optionType.interactive, component: ftParticlesInteractive }
  ],
  [ExhibitEnum.FtRotateCube]: [
    { label: "基础配置", value: optionType.global, component: ftRotateCubeGlobal },
    { label: "动画配置", value: optionType.animation, component: ftRotateCubeAnimation },
    { label: "外观配置", value: optionType.style, component: ftRotateCubeStyle },
    { label: "图片配置", value: optionType.picture, component: ftRotateCubePicture }
  ],
  [ExhibitEnum.FtSignaturePad]: [
    { label: "基础配置", value: optionType.global, component: ftSignaturePadGlobal },
    { label: "操作控制", value: optionType.edit, component: ftSignaturePadEdit },
    { label: "配置控制", value: optionType.control, component: ftSignaturePadControl }
  ],
  [ExhibitEnum.FtTranslation]: [
    { label: "全局", value: optionType.global, component: ftTranslationGlobal },
    { label: "译文字典", value: optionType.dic, component: ftTranslationDic }
  ],
  [ExhibitEnum.FtCarouselImageV2]: [
    { label: "全局", value: optionType.global, component: ftCarouselImageV2Global },
    { label: "图片列表", value: optionType.picList, component: ftCarouselImageV2PicList }
  ],
  [ExhibitEnum.FtFilter]: [
    { label: "全局", value: optionType.global, component: ftFilterGlobal },
    { label: "滤镜", value: optionType.filter, component: ftFilterFilter }
  ],
  [ExhibitEnum.FtFlexDecoration]: [
    { label: "边框", value: optionType.global, component: ftFlexDecorationGlobal }
  ],
  [ExhibitEnum.FtNinePatch]: [
    { label: "全局", value: optionType.global, component: ftNinePatchGlobal }
  ],
  [ExhibitEnum.verticalCard]: [
    { label: "全局", value: optionType.global, component: verticalCardGlobal },
    { label: "图片列表", value: optionType.picList, component: verticalCardPicList }
  ],
  [ExhibitEnum.FtRotate]: [{ label: "全局", value: optionType.global, component: ftRotateGlobal }],
  [ExhibitEnum.FtSlidecardV1]: [
    { label: "全局", value: optionType.global, component: ftSlidecardV1Global, hidden: true }
  ],
  [ExhibitEnum.FtTurnPage]: [
    { label: "全局", value: optionType.global, component: ftTurnPageGlobal }
  ]
};
