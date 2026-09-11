import type { FolderEnum } from "@screenwright/types";

import {
  extractLayout,
  FT_GROUP_MODULE_ID,
  getComponentDefaultConfigByModuleId,
  parseBackdropFilter,
  setComponentBaseProps
} from "@/mastra/tools/utils";
import type { ComponentType } from "@/mastra/types";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";

import type { ConvertParams, ConvertResult, ConvertStrategy } from "./types";

export interface GroupOption {
  transform?: boolean;
  perspective?: number;
  originGrid?: { left: string; top: string };
  originX?: number;
  originY?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  skewX?: number;
  skewY?: number;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  translateZ?: number;
  backdropFilter?: boolean;
  backdropFilterBlur?: number;
  backdropFilterSaturate?: number;
}

export type GroupData = unknown;
export type Group = ComponentType<FolderEnum.group, GroupOption, unknown>;

function convertNodeToGroupOption(node: NormalizedNode): Partial<GroupOption> {
  const option: Partial<GroupOption> = {};

  option.transform = false;
  option.perspective = 0;
  option.originGrid = { left: "center", top: "center" };
  option.originX = 50;
  option.originY = 50;
  option.rotateX = 0;
  option.rotateY = 0;
  option.rotateZ = 0;
  option.skewX = 0;
  option.skewY = 0;
  option.scaleX = 100;
  option.scaleY = 100;
  option.translateX = 0;
  option.translateY = 0;
  option.translateZ = 0;

  option.backdropFilter = false;
  option.backdropFilterBlur = 4;
  option.backdropFilterSaturate = 100;

  if (node.effects?.backdropFilter) {
    const backdrop = parseBackdropFilter(node.effects.backdropFilter);
    if (backdrop.blur !== undefined || backdrop.saturate !== undefined) {
      option.backdropFilter = true;
      if (backdrop.blur !== undefined) {
        option.backdropFilterBlur = backdrop.blur;
      }
      if (backdrop.saturate !== undefined) {
        option.backdropFilterSaturate = backdrop.saturate;
      }
    }
  }

  return option;
}

export class GroupStrategy implements ConvertStrategy {
  async convert({ node }: ConvertParams): Promise<ConvertResult> {
    const { node: normalizedNode, zIndex, depth } = node;

    const convertedOption = convertNodeToGroupOption(normalizedNode);
    const layout = extractLayout(normalizedNode);

    const component: Group = (await getComponentDefaultConfigByModuleId(FT_GROUP_MODULE_ID)) as Group;

    setComponentBaseProps(component, normalizedNode, layout);

    component.option = {
      ...component.option,
      ...convertedOption
    };
    component.children = [];
    component.isExpand = true;
    component.zIndex = zIndex ?? depth;
    component.isOuter = true;

    return { component, message: "成功转换为 Group" };
  }
}
