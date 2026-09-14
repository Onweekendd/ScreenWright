import type { barEchartClass } from "../type";
import { PanelType } from "../type";
import { ArtifactAppPreview } from "./ArtifactAppPreview";
import { DynamicPanel } from "./DynamicPanel";
import { EncodePanel } from "./EncodePanel";
import { QuotePanel } from "./Quote";

type PanelComponent = typeof ArtifactAppPreview | typeof DynamicPanel | typeof EncodePanel | typeof QuotePanel;

/**
 * @description 组件名 -> 组件类
 */
export const panelInstanceToType: barEchartClass<PanelComponent, PanelType> = {
  [PanelType.artifactAppPreview]: ArtifactAppPreview,
  [PanelType.dynamicPanel]: DynamicPanel,
  [PanelType.encodePanel]: EncodePanel,
  [PanelType.quotePanel]: QuotePanel
};

export const DYNAMIC_PANEL_MODULE_ID = 69;
export const ENCODE_PANEL_MODULE_ID = 102;
export const QUOTE_PANEL_MODULE_ID = 70;
// 使用未被种子数据占用的 ID，并同步写入 modules-data.json，避免重建数据库时丢失。
export const ARTIFACT_APP_PREVIEW_MODULE_ID = 154;
