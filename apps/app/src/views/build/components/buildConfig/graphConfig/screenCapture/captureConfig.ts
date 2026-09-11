/* @ts-nocheck */
/** 截图全局配置 */
// §0 配置
// ─────────────────────────────────────────────────────────────
const CFG = {
  delay: 800,
  loadingWait: 60000,
  contentWaitMax: 30000,
  ueWaitMax: 20000,
  chartWaitMax: 25000,
  poll: 250,
  estimateHintSec: 22,
  captureAttr: "data-h2c-capture-id",
  backgroundColor: "#181a24",
  layerScale: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
  ueFullScreen: true,
  fallbackFullCanvas: true,
  maxLayers: 80,
  domCaptureMode: "overlay",
  /** 纯图图层单独栅格化；关闭后 img 随 overlay 一起截，靠 live patch 保证 minio 图不丢 */
  useExtractImageLayers: false,
  /** 大图加载等待超时（ms） */
  imageLoadTimeout: 45000
};

const LOG = "[图层截图]";
/** snapdom afterClone 中定位 scale 容器，避免写死 .view-wrapper */
const CAPTURE_WRAPPER_ATTR = "data-layer-capture-wrapper";

export { CAPTURE_WRAPPER_ATTR, CFG, LOG };
