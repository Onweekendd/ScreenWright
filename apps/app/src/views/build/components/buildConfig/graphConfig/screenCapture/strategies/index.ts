export { CaptureStrategyFactory } from "./captureStrategyFactory";
export {
  createDomStrategy,
  createGroupComponentStrategy,
  createPanelStrategy,
  type DomStrategyDeps,
  type GroupComponentStrategyDeps,
  type PanelStrategyDeps
} from "./containerModuleStrategies";
export { createContainerModuleStrategy } from "./createContainerModuleStrategy";
export { FontDomCapture, TextDomCapture } from "./fontDomCapture";
export { createFontDomStrategy, FontDomStrategy, registerFontDomStrategy } from "./fontDomStrategy";
export {
  collectReadySelectors,
  detectSpecialComponentKey,
  findSpecialRasterTarget,
  hostHasSpecialMarker,
  prepareOverflowForCapture,
  SPECIAL_COMPONENT_MARKERS,
  SPECIAL_COMPONENT_SELECTOR,
  specialLayerIdToModuleId
} from "./specialComponentRegistry";
export {
  createSpecialComponentStrategy,
  rasterizeSpecialHostIfNeeded,
  registerSpecialComponentStrategy,
  SpecialComponentStrategy
} from "./specialComponentStrategy";
export { type CaptureModuleContext, CaptureModuleStrategyKind, type ICaptureModuleStrategy } from "./types";
export {
  detectVideoKind,
  hostHasVideo,
  isStreamVideoElement,
  isStreamVideoHost,
  isVideoPrimaryHost,
  VideoKind
} from "./videoRegistry";
export {
  createVideoStrategy,
  isVideoModuleHost,
  registerVideoStrategy,
  type VideoCaptureEngine,
  VideoStrategy
} from "./videoStrategy";
