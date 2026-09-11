import { AdaptationType, type PanelEnum, type PanelState, type SystemComponentProps } from "@screenwright/types";

import {
  clampLayoutToMergeParent,
  extractLayout,
  FT_PANEL_MODULE_ID,
  getComponentDefaultConfigByModuleId,
  localPathToResourcePath,
  setComponentBaseProps
} from "@/mastra/tools/utils";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";

import type { ConvertParams, ConvertResult, ConvertStrategy } from "./types";

export enum customPositionTypeEnum {
  toLeft = "toLeft",
  toCenter = "toCenter",
  toRight = "toRight",
  toCenterTop = "toCenterTop",
  toCenterBottom = "toCenterBottom",
  toCustom = "toCustom"
}

export interface DynamicPanelOption {
  enableScroll: boolean;
  gestureSliding: boolean;
  rotationShow: boolean;
  rotationType: string;
  autoRotation: boolean;
  arrowShow: boolean;
  imgLeft: string;
  imgRight: string;
  arrowWidth: number;
  arrowHeight: number;
  animationType: string;
  timingFunction: number;
  card1TranslateX: number;
  card1TranslateY: number;
  card1ScaleX: number;
  card1ScaleY: number;
  card1Opacity: number;
  card2TranslateX: number;
  card2TranslateY: number;
  card2ScaleX: number;
  card2ScaleY: number;
  card2Opacity: number;
  isCard3Show: boolean;
  card3TranslateX: number;
  card3TranslateY: number;
  card3ScaleX: number;
  card3ScaleY: number;
  card3Opacity: number;
  isSwitchStatusReload: boolean;
  perspective: number;
  originGrid: string;
  originX: number;
  originY: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  skewX: number;
  skewY: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  translateZ: number;
  isPreLoad: boolean;
  customPosition: boolean;
  customPositionType: customPositionTypeEnum;
  customPositionX?: number;
  customPositionY?: number;
  customPositionLeft?: number;
  customPositionRight?: number;
  customPositionTop?: number;
  customPositionBottom?: number;
  maxCacheSize?: number;
  preloadAdjacent?: boolean;
  adjacentCount?: number;
}

export type FtPanel = SystemComponentProps<PanelEnum.dynamicPanel> & {
  option: DynamicPanelOption;
};

export function createPanelState(index: number = 1): PanelState {
  return {
    id: crypto.randomUUID(),
    title: `状态${index}`,
    name: `状态${index}`,
    config: [],
    backgroundColor: "transparent",
    showBackgroundImage: false,
    backgroundImage: "",
    showScreenAdaptation: false,
    adaptationNorm: "1920*1080",
    adaptationType: AdaptationType.fill
  };
}

function convertNodeToDynamicPanelOption(_node: NormalizedNode): Partial<DynamicPanelOption> {
  return {};
}

export class FtPanelStrategy implements ConvertStrategy {
  async convert({ node }: ConvertParams): Promise<ConvertResult> {
    const { node: normalizedNode, zIndex, depth } = node;

    const panelStates = createPanelState();
    // 容器背景图：节点带 imgLocalPath（Codia 的 backgroundConfig.type==="IMAGE" 落在容器节点上，
    // 或 figma 路 resolveImages 匹配到的资源），灌进面板状态的背景图。
    // localPathToResourcePath 对 http(s) URL 原样返回、对本地路径转 ./assets/*。
    if (normalizedNode.imgLocalPath) {
      panelStates.backgroundImage = localPathToResourcePath(normalizedNode.imgLocalPath);
      panelStates.showBackgroundImage = true;
    }
    const convertedOption = convertNodeToDynamicPanelOption(normalizedNode);
    const layout = extractLayout(normalizedNode);
    layout.width = layout.width || 400;
    layout.height = layout.height || 300;

    const component: FtPanel = (await getComponentDefaultConfigByModuleId(FT_PANEL_MODULE_ID)) as unknown as FtPanel;

    setComponentBaseProps(component, normalizedNode, clampLayoutToMergeParent(normalizedNode.id, layout));

    component.option = {
      ...component.option,
      ...convertedOption
    };
    component.panelData = [panelStates];
    component.activeStatusId = panelStates ? panelStates.id : null;
    component.zIndex = zIndex ?? depth;

    return { component, message: "成功转换为 FtPanel" };
  }
}
