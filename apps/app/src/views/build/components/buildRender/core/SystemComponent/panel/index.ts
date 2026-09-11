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
// 154 而不是 119：119 在 scripts/modules-data.json 里自初始提交起就是「PDF容器v1」，
// 之前手工往库里插的那行被重新 seed 时按 name 覆盖回去了。改用 seed 未占用的下一个 id，
// 并把这行本身也写进 modules-data.json —— 只存在于数据库里的模块，下次重建库还会再丢一次。
export const ARTIFACT_APP_PREVIEW_MODULE_ID = 154;
