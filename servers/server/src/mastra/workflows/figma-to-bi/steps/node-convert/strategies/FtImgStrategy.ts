import type { MediaEnum } from "@screenwright/types";

import {
  clampLayoutToMergeParent,
  extractLayout,
  FT_IMG_MODULE_ID,
  getComponentDefaultConfigByModuleId,
  localPathToResourcePath,
  parseBackdropFilter,
  parseBoxShadow,
  setComponentBaseProps
} from "@/mastra/tools/utils";
import type { ComponentType } from "@/mastra/types";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";

import type { ConvertParams, ConvertResult, ConvertStrategy } from "./types";

export interface FtImgOption {
  cover: string;
  url: string;
  duration: string;
  shadowExtension: number;
  image?: string;
  pointerEvents?: boolean;
  openReview?: boolean;
  reviewImageWidth?: number;
  opacity?: number;
  mixBlendMode?: string;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImageType?: string;
  rotateShow?: boolean;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  gaussianBlurShow?: boolean;
  gaussianBlur?: number;
  brightnessShow?: boolean;
  brightness?: number;
  contrastShow?: boolean;
  contrast?: number;
  grayscaleShow?: boolean;
  grayscale?: number;
  hueShow?: boolean;
  hue?: number;
  invertShow?: boolean;
  invert?: number;
  saturateShow?: boolean;
  saturate?: number;
  sepiaShow?: boolean;
  sepia?: number;
  shadowShow?: boolean;
  shadowColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowFuzzy?: number;
  animationShow?: boolean;
  animationLoop?: boolean;
  animationendHidden?: boolean;
  animationSpeed?: string;
  animationSpeedNum?: number;
  animationTime?: number;
  animationDelayed?: number;
  animationInterval?: number;
  animationType?: string;
  backdropFilter?: boolean;
  backdropFilterBlur?: number;
  backdropFilterSaturate?: number;
}

export type FtImgData = { value: string }[];

export type FtImg = ComponentType<MediaEnum.FtImg, FtImgOption, FtImgData>;

function extractImageUrl(node: NormalizedNode): string {
  if (node.imgLocalPath) {
    return localPathToResourcePath(node.imgLocalPath);
  }
  return "./assets/assets/defaultImg/default.png";
}

function convertNodeToFtImgOption(node: NormalizedNode): Partial<FtImgOption> {
  const option: Partial<FtImgOption> = {};

  if (node.opacity !== undefined && node.opacity !== 1) {
    option.opacity = node.opacity;
  }

  if (node.effects) {
    if (node.effects.boxShadow) {
      const shadow = parseBoxShadow(node.effects.boxShadow);
      if (shadow) {
        option.shadowShow = true;
        option.shadowX = shadow.shadowX;
        option.shadowY = shadow.shadowY;
        option.shadowFuzzy = shadow.shadowFuzzy;
        option.shadowExtension = shadow.shadowExtension;
        option.shadowColor = shadow.shadowColor;
      }
    }

    if (node.effects.backdropFilter) {
      const backdrop = parseBackdropFilter(node.effects.backdropFilter);
      if (backdrop.blur !== undefined) {
        option.backdropFilter = true;
        option.backdropFilterBlur = backdrop.blur;
      }
      if (backdrop.saturate !== undefined) {
        option.backdropFilterSaturate = backdrop.saturate;
      }
    }
  }

  return option;
}

export class FtImgStrategy implements ConvertStrategy {
  async convert({ node }: ConvertParams): Promise<ConvertResult> {
    const { node: normalizedNode, zIndex, depth } = node;

    const imageUrl = extractImageUrl(normalizedNode);
    const convertedOption = convertNodeToFtImgOption(normalizedNode);
    const layout = extractLayout(normalizedNode);

    const component: FtImg = (await getComponentDefaultConfigByModuleId(FT_IMG_MODULE_ID)) as FtImg;

    setComponentBaseProps(component, normalizedNode, clampLayoutToMergeParent(normalizedNode.id, layout));

    component.data = [{ value: imageUrl }];
    component.option = {
      ...component.option,
      ...convertedOption,
      url: imageUrl
    };
    component.zIndex = zIndex ?? depth;

    return { component, message: "成功转换为 ftImg (默认)" };
  }
}
