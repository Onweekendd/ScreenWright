/** 面板内容入口：从外层 go-shape-box 进入内层 content root */
import { PanelEnum } from "@screenwright/types";

import { CaptureNodeKind } from "../captureUtils";

export const PanelEntryResolver = {
  getContentRoot(host: HTMLElement, kind: string, panelProp: string) {
    if (!host) {
      return null;
    }
    const isQuote =
      kind === CaptureNodeKind.PANEL_QUOTE || panelProp === PanelEnum.quotePanel || host.querySelector(".quote-panel");
    if (isQuote) {
      return (
        host.querySelector(".quote-panel .screen-quote") ||
        host.querySelector(".quote-panel .panel-view") ||
        host.querySelector(".quote-panel")
      );
    }

    const ftPanel = host.querySelector(".ft-panel");
    if (!ftPanel) {
      return null;
    }

    if (kind === CaptureNodeKind.PANEL_DYNAMIC || panelProp === PanelEnum.dynamicPanel) {
      return (
        ftPanel.querySelector(".panel-layout .status-view") ||
        ftPanel.querySelector(".status-view") ||
        ftPanel.querySelector(".panel-view") ||
        ftPanel
      );
    }

    return ftPanel.querySelector(".panel-layout .panel-view") || ftPanel.querySelector(".panel-view") || ftPanel;
  }
};
