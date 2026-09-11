import { AdaptationType, type LargeScreenDetailInfo } from "@screenwright/types";

import type { EditorCoreState, NavInfo } from "../types/state";

/**
 * 生成一份全新的默认大屏详细配置（每次调用返回新对象，避免共享引用）。
 */
export function createDefaultDetail(): LargeScreenDetailInfo {
  return {
    width: "1920",
    height: "1080",
    scale: 1,
    theme: "default",
    initLoad: true,
    minioIds: [],
    backgroundImage: "",
    backgroundColor: "",
    showBackgroundImage: false,
    showScreenAdaptation: false,
    adaptationNorm: "",
    adaptationType: AdaptationType.fill,
    showScreenFilter: false,
    screenFilterInfo: {
      gaussianBlur: 0,
      brightness: 0,
      contrast: 0,
      grayscale: 0,
      hue: 0,
      saturate: 0,
      invert: 0,
      sepia: 0,
      hueRotate: 0
    },
    showWaterMark: false,
    waterMark: {
      text: "",
      fontFamily: "",
      fontStyle: "",
      fontWeight: "",
      fontSize: 0,
      color: "",
      degree: 0
    },
    gridDistance: 0,
    query: {},
    controlWebsocketUrl: "",
    heartbeatInterval: 15,
    terminalEnableArr: {},
    name: "",
    mark: {},
    isEncodedControl: false,
    zIndexMap: {}
  };
}

/**
 * 生成一份全新的默认大屏元信息（每次调用返回新对象，避免共享引用）。
 */
export function createDefaultNavInfo(): NavInfo {
  return {
    id: -1,
    name: "",
    versionCode: "",
    versionDesc: null,
    status: false,
    config: [],
    backgroundUrl: "",
    invitationCode: "",
    type: 0,
    aniFrameSet: {
      animationList: [],
      activeAnimationList: []
    },
    statusAnimation: {
      animations: {},
      statusAnimations: {},
      componentAnimations: {}
    },
    dataFilterArr: {},
    userId: 0,
    updatedBy: "",
    updatedTime: "",
    encodedControl: [],
    detail: createDefaultDetail()
  };
}

/** 默认大屏元信息常量（向后兼容旧的具名导出）。 */
export const defaultNavInfo: NavInfo = createDefaultNavInfo();

/** 生成编辑器核心状态的初始值。 */
export function createInitialState(): EditorCoreState {
  return {
    navInfo: createDefaultNavInfo(),
    layers: [],
    componentList: [],
    targetChart: { hoverId: undefined, selectId: [] }
  };
}
