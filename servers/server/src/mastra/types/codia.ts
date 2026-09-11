/**
 * 颜色表示
 */
export interface VisualColor {
  /**
   * Hex 颜色代码（如 "#FFFFFF"）
   */
  hexCode?: string;
  /**
   * RGB 三元组，如 [255, 255, 255]
   */
  rgbValues?: [number, number, number];
}

/**
 * 尺寸规范
 */
export interface DimensionSpec {
  /**
   * 尺寸模式
   * - FIXED：固定尺寸（使用 value）
   * - FILL：撑满父容器
   * - FIT_CONTENT：根据内容自适应
   */
  sizing: "FIXED" | "FILL" | "FIT_CONTENT";
  /**
   * 尺寸数值（仅在 sizing 为 FIXED 时有意义）
   */
  value?: number;
}

/**
 * 布局配置，控制元素在其父容器中的定位方式
 */
export interface LayoutConfig {
  /**
   * 定位模式
   * - Normal：常规文档流
   * - Absolute：绝对定位（需提供 absoluteAttrs）
   * - Relative：相对定位
   * - Flex：Flex 弹性布局（需提供 flexAttributes）
   */
  positionMode: "Normal" | "Absolute" | "Relative" | "Flex";
  /**
   * Flex 布局的变体标识，由检测器提供（如 "Flex"）
   */
  flexibleMode?: string;
  /**
   * 绝对定位属性，仅在 positionMode 为 "Absolute" 时存在
   */
  absoluteAttrs?: {
    /**
     * 对齐方式
     */
    align?: string;
    /**
     * 坐标偏移量（结构未明确定义）
     */
    coord?: Record<string, any>;
    /**
     * 原始坐标（结构未明确定义）
     */
    orginCoord?: Record<string, any>;
  };
  /**
   * Flex 属性，仅在 positionMode 为 "Flex" 时使用
   */
  flexAttributes?: {
    /**
     * 交叉轴对齐方式
     */
    alignItems?: string;
    /**
     * 主轴方向
     */
    flexDirection?: string;
    /**
     * 换行方式
     */
    flexWrap?: string;
    /**
     * 主轴对齐方式
     */
    justifyContent?: string;
  };
}

/**
 * 元素处理元数据，包含检测置信度和几何信息
 */
export interface ProcessingMeta {
  /**
   * 检测置信度，取值范围 0.0 ~ 1.0
   */
  detectionScore?: number;
  /**
   * 元素面积（像素）
   */
  surfaceArea?: number;
  /**
   * 文本是否位于容器内部
   */
  textContainerized?: boolean;
}

/**
 * 边框配置
 */
export interface BorderConfig {
  /**
   * 边框颜色
   */
  borderColor?: VisualColor;
  /**
   * 圆角半径，顺序为 [左上, 右上, 右下, 左下]
   */
  borderRadius?: number[];
  /**
   * 边框样式（如 "solid", "dashed"）
   */
  borderStyle?: string;
  /**
   * 边框宽度（像素）
   */
  borderWidth?: number;
}

/**
 * 文本样式配置
 */
export interface TextConfig {
  /**
   * 字体族
   */
  fontFamily?: string;
  /**
   * 字号（像素）
   */
  fontSize?: number;
  /**
   * 字体样式
   */
  fontStyle?: "normal" | "bold" | "italic" | "semi_bold";
  /**
   * 字符间距（CSS px），相对于 OCR 测量的字号
   */
  letterSpacing?: number;
  /**
   * 行高（CSS px）
   */
  lineHeight?: number;
  /**
   * 文本对齐方式
   */
  textAlign?: string[];
}

/**
 * 背景配置，支持纯色、图片和线性渐变
 */
export type BackgroundConfig =
  | {
      /**
       * 背景类型：纯色
       */
      type: "COLOR";
      /**
       * 背景颜色
       */
      backgroundColor: VisualColor;
    }
  | {
      /**
       * 背景类型：图片
       */
      type: "IMAGE";
      /**
       * 图片 URL（Codia CDN）
       */
      imageUrl: string;
      /**
       * 背景大小（如 "cover", "contain"）
       */
      backgroundSize?: string;
      /**
       * 背景位置（如 "center"）
       */
      backgroundPosition?: string;
    }
  | {
      /**
       * 背景类型：线性渐变
       */
      type: "LINEAR_GRADIENT";
      /**
       * 渐变角度（度数）
       */
      deg: number;
      /**
       * 渐变颜色停止点列表
       */
      gradientStops: Array<{
        /**
         * 停止点颜色
         */
        color: VisualColor;
        /**
         * 停止点位置，取值范围 0 ~ 1
         */
        position: number;
      }>;
    };

/**
 * 样式配置，定义元素的外观属性
 */
export interface StyleConfig {
  /**
   * 背景配置（纯色/图片/渐变）
   */
  backgroundConfig?: BackgroundConfig;
  /**
   * 边框配置
   */
  borderConfig?: BorderConfig;
  /**
   * 视觉效果列表（阴影、模糊等）
   */
  effectsList?: any[];
  /**
   * 高度尺寸规范
   */
  heightSpec?: DimensionSpec;
  /**
   * 透明度值，0 ~ 255，CSS 透明度需除以 255
   */
  opacityLevel?: number;
  /**
   * 溢出处理方式
   */
  overflowMode?: any[];
  /**
   * 内边距，顺序为 [上, 右, 下, 左]
   */
  paddingValues?: number[];
  /**
   * 旋转角度（度数）
   */
  rotationAngle?: number;
  /**
   * 文本颜色（仅对 Text 元素有效）
   */
  textColor?: VisualColor;
  /**
   * 文本样式配置（仅对 Text 元素有效）
   */
  textConfig?: TextConfig;
  /**
   * 宽度尺寸规范
   */
  widthSpec?: DimensionSpec;
}

/**
 * 内容数据，定义了元素显示的具体内容（根据元素类型填充不同字段）
 */
export interface ContentData {
  /**
   * 英文显示名称
   */
  displayName?: string;
  /**
   * 文本内容（Text 节点）
   */
  textValue?: string;
  /**
   * 图片资源 URL（Image 节点，Codia CDN）
   */
  imageSource?: string;
  /**
   * 组件引用标识（Component 节点）
   */
  componentReference?: string;
  /**
   * 组件属性（Component 节点）
   */
  componentAttributes?: Record<string, any>;
  /**
   * 矢量形状数据（Vector 节点）
   */
  vectorData?: any;
}

/**
 * 可复用组件定义（当 elementType 为 Component 时使用）
 */
export interface ComponentSpec {
  // 具体字段待补充，可根据实际需要扩展
}

/**
 * 视觉元素节点，构成 UI 树的基本单元（递归结构）
 */
export interface VisualElement {
  /**
   * 唯一标识符（用于 React key 或 Figma 节点 ID）
   */
  elementId: string;
  /**
   * 显示名称
   */
  elementName: string;
  /**
   * 元素类别
   */
  elementType: "Body" | "Layer" | "Image" | "Text" | "Component" | "Vector" | "Group";
  /**
   * 布局配置
   */
  layoutConfig: LayoutConfig;
  /**
   * 样式配置（视觉外观）
   */
  styleConfig: StyleConfig;
  /**
   * 处理元数据（置信度、面积等）
   */
  processingMeta: ProcessingMeta;
  /**
   * 内容数据（仅在叶子节点如 Text/Image/Component 时填充）
   */
  contentData?: ContentData;
  /**
   * 子元素列表（递归）
   */
  childElements?: VisualElement[];
  /**
   * 可复用组件定义（当 elementType 为 Component 时存在）
   */
  componentSpec?: ComponentSpec;
}

/**
 * 全局渲染设置，用于缩放和画布基准
 */
export interface Configuration {
  /**
   * 设计稿基准宽度（如 375 表示移动端，1440 表示桌面）
   */
  baseWidth: number;
  /**
   * 测量单位：px 或 pt
   */
  measurementUnit: "px" | "pt";
  /**
   * 缩放系数，渲染时所有数值需乘以该值
   */
  scalingFactor: number;
}

/**
 * Codia 响应中的数据部分（信封内部的 data 字段）
 */
export interface Data {
  /**
   * 全局渲染配置
   */
  configuration: Configuration;
  /**
   * 视觉树根节点，类型固定为 "Body"
   */
  visualElement: VisualElement;
}
