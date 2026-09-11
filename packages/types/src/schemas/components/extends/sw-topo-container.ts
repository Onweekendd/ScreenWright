import { z } from "zod";

/**
 * 拓扑容器 (ft-topo-container)
 * 扩展
 *
 * ## 数据结构
 * 无数据字段（data为空数组）
 */

export const swTopoContainerDataSchema = z.array(z.never());
export type ftTopoContainerData = z.infer<typeof swTopoContainerDataSchema>;

export const swTopoContainerOptionSchema = z.object({
  topoBgType: z.string().describe("拓扑背景类型(color/image)"),
  topoBgColor: z.string().describe("拓扑背景颜色"),
  topoBgImage: z.string().describe("拓扑背景图片路径"),
  topoData: z.object({
    nodes: z.array(z.unknown()).describe("拓扑节点列表"),
    edges: z.array(z.unknown()).describe("拓扑边列表")
  }).describe("拓扑数据(节点和边)"),
  perspective: z.number().describe("透视距离"),
  originX: z.number().describe("变换原点X坐标(百分比)"),
  originY: z.number().describe("变换原点Y坐标(百分比)"),
  rotateX: z.number().describe("X轴旋转角度"),
  rotateY: z.number().describe("Y轴旋转角度"),
  rotateZ: z.number().describe("Z轴旋转角度"),
  skewX: z.number().describe("X轴倾斜角度"),
  skewY: z.number().describe("Y轴倾斜角度"),
  scaleX: z.number().describe("X轴缩放比例"),
  scaleY: z.number().describe("Y轴缩放比例"),
  translateX: z.number().describe("X轴平移距离"),
  translateY: z.number().describe("Y轴平移距离"),
  translateZ: z.number().describe("Z轴平移距离"),
  originGrid: z.object({
    left: z.string().describe("水平对齐方式"),
    top: z.string().describe("垂直对齐方式")
  }).describe("变换原点网格配置")
});

export type ftTopoContainerOption = z.infer<typeof swTopoContainerOptionSchema>;
