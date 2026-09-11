/** 容器节点分类：panel / group / leaf */
import { PanelEnum } from "@screenwright/types";

import { CaptureNodeKind, ComponentTreeCapture } from "../captureUtils";
import { castHtml as asHtml } from "../dom/captureDomHelpers";
import { UeStreamCapture } from "../media/ueStreamCapture";
import type { CaptureComponentItem } from "../types/captureInternal";

export const CaptureNodeClassifier = {
  classify(item: CaptureComponentItem, host: Element | null) {
    const prop = item && item.component && item.component.prop;
    if (ComponentTreeCapture.isPanelComponent(item)) {
      if (prop === PanelEnum.dynamicPanel) {
        return CaptureNodeKind.PANEL_DYNAMIC;
      }
      if (prop === PanelEnum.quotePanel) {
        return CaptureNodeKind.PANEL_QUOTE;
      }
      if (prop === PanelEnum.encodePanel) {
        return CaptureNodeKind.PANEL_ENCODE;
      }
      return CaptureNodeKind.PANEL_DYNAMIC;
    }
    if (host && UeStreamCapture.isHost(asHtml(host))) {
      return CaptureNodeKind.UE_STREAM;
    }
    if (item && Array.isArray(item.children) && item.children.length > 0) {
      return CaptureNodeKind.GROUP;
    }
    return CaptureNodeKind.LEAF;
  },

  isPanelKind(kind: string) {
    return (
      kind === CaptureNodeKind.PANEL_DYNAMIC ||
      kind === CaptureNodeKind.PANEL_SPECIAL ||
      kind === CaptureNodeKind.PANEL_QUOTE ||
      kind === CaptureNodeKind.PANEL_ENCODE
    );
  }
};
