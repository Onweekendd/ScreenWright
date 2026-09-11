import { z } from "zod";

/**
 * 360全景容器v1 (photo-sphere-viewer)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `value` - 全景图片路径
 */

// 单个数据项的 Schema
const photoSphereViewerDataItemSchema = z.object({
  value: z.string().describe("全景图片路径")
});

export const photoSphereViewerDataSchema = z.array(photoSphereViewerDataItemSchema);
export type photoSphereViewerData = z.infer<typeof photoSphereViewerDataSchema>;

export const photoSphereViewerOptionSchema = z.object({
  muted: z.boolean().describe("是否静音"),
  initLoad: z.boolean().describe("是否初始化加载"),
  cover: z.string().describe("封面图片路径"),
  minFov: z.number().describe("最小视场角"),
  maxFov: z.number().describe("最大视场角"),
  defaultZoomLvl: z.number().describe("默认缩放级别"),
  fisheye: z.boolean().describe("是否启用鱼眼效果"),
  defaultYaw: z.number().describe("默认水平偏转角"),
  defaultPitch: z.number().describe("默认垂直俯仰角"),
  loadingImg: z.string().describe("加载中图片路径"),
  loadingTxt: z.string().describe("加载中提示文字"),
  mousewheel: z.boolean().describe("是否启用鼠标滚轮缩放"),
  mousemove: z.boolean().describe("是否启用鼠标拖拽旋转"),
  keyboard: z.string().describe("键盘控制模式"),
  mousewheelCtrlKey: z.boolean().describe("鼠标滚轮是否需要Ctrl键"),
  touchmoveTwoFingers: z.boolean().describe("是否需要双指触摸旋转"),
  sphereCorrection: z.object({
    pan: z.number().describe("水平校正角度"),
    tilt: z.number().describe("倾斜校正角度"),
    roll: z.number().describe("滚动校正角度")
  }).describe("球面校正参数"),
  moveSpeed: z.number().describe("移动速度"),
  zoomSpeed: z.number().describe("缩放速度"),
  moveInertia: z.number().describe("移动惯性系数"),
  withCredentials: z.boolean().describe("是否携带凭证"),
  canvasBackground: z.string().describe("画布背景色"),
  rendererParameters: z.object({
    alpha: z.boolean().describe("是否启用透明"),
    antialias: z.boolean().describe("是否启用抗锯齿")
  }).describe("渲染器参数"),
  showNavbar: z.boolean().describe("是否显示导航栏"),
  navbarList: z.array(z.string()).describe("导航栏按钮列表"),
  autostart: z.boolean().describe("是否自动开始自动旋转"),
  autostartDelay: z.number().describe("自动旋转延迟(毫秒)"),
  autostartOnIdle: z.boolean().describe("空闲时是否自动旋转"),
  autorotateSpeed: z.number().describe("自动旋转速度"),
  autorotatePitch: z.number().describe("自动旋转俯仰角"),
  showMarkers: z.boolean().describe("是否显示标记点"),
  showGallery: z.boolean().describe("是否显示图库"),
  visibleOnLoad: z.boolean().describe("加载时是否可见"),
  thumbnailSize: z.object({
    width: z.number().describe("缩略图宽度"),
    height: z.number().describe("缩略图高度")
  }).describe("缩略图尺寸"),
  galleryItems: z.array(z.object({
    id: z.string().describe("图片ID"),
    name: z.string().describe("图片名称"),
    panorama: z.string().describe("全景图路径"),
    thumbnail: z.string().describe("缩略图路径"),
    caption: z.string().describe("图片说明文本"),
    markers: z.array(z.unknown()).describe("标记点列表")
  })).describe("图库图片列表")
});

export type photoSphereViewerOption = z.infer<typeof photoSphereViewerOptionSchema>;
