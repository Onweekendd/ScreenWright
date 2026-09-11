/**
 * @interface BasicPoint
 * @description 基础点对象，表示二维平面上的一个点及其压力和时间属性
 */
export interface BasicPoint {
  /** X坐标值 */
  x: number;
  /** Y坐标值 */
  y: number;
  /** 压力值，用于触摸设备 */
  pressure: number;
  /** 时间戳，记录点创建的时间 */
  time: number;
}

/**
 * @class Point
 * @description 点类，实现了BasicPoint接口，提供点操作的方法
 */
export declare class Point implements BasicPoint {
  /** X坐标值 */
  x: number;
  /** Y坐标值 */
  y: number;
  /** 压力值，用于触摸设备 */
  pressure: number;
  /** 时间戳，记录点创建的时间 */
  time: number;

  /**
   * @constructor
   * @param {number} x - X坐标值
   * @param {number} y - Y坐标值
   * @param {number} [pressure] - 压力值，默认为0
   * @param {number} [time] - 时间戳，默认为当前时间
   */
  constructor(x: number, y: number, pressure?: number, time?: number);

  /**
   * @method distanceTo
   * @description 计算当前点到目标点的距离
   * @param {BasicPoint} start - 目标点
   * @returns {number} 两点之间的欧氏距离
   */
  distanceTo(start: BasicPoint): number;

  /**
   * @method equals
   * @description 判断当前点与另一个点是否相等
   * @param {BasicPoint} other - 待比较的点
   * @returns {boolean} 如果两点所有属性都相等，则返回true
   */
  equals(other: BasicPoint): boolean;

  /**
   * @method velocityFrom
   * @description 计算从起始点到当前点的速度
   * @param {BasicPoint} start - 起始点
   * @returns {number} 速度值 (距离/时间)
   */
  velocityFrom(start: BasicPoint): number;
}

/**
 * @class Bezier
 * @description 贝塞尔曲线类，用于平滑签名轨迹
 */
export declare class Bezier {
  /** 起始点 */
  startPoint: Point;
  /** 控制点2 */
  control2: BasicPoint;
  /** 控制点1 */
  control1: BasicPoint;
  /** 终止点 */
  endPoint: Point;
  /** 起始宽度 */
  startWidth: number;
  /** 终止宽度 */
  endWidth: number;

  /**
   * @static
   * @method fromPoints
   * @description 从点集合创建贝塞尔曲线
   * @param {Point[]} points - 点集合
   * @param {{start: number, end: number}} widths - 曲线起始和终止宽度
   * @returns {Bezier} 贝塞尔曲线实例
   */
  static fromPoints(
    points: Point[],
    widths: {
      start: number;
      end: number;
    }
  ): Bezier;

  /**
   * @private
   * @static
   * @method calculateControlPoints
   * @description 计算贝塞尔曲线的控制点
   */
  private static calculateControlPoints;

  /**
   * @constructor
   * @param {Point} startPoint - 起始点
   * @param {BasicPoint} control2 - 控制点2
   * @param {BasicPoint} control1 - 控制点1
   * @param {Point} endPoint - 终止点
   * @param {number} startWidth - 起始宽度
   * @param {number} endWidth - 终止宽度
   */
  constructor(
    startPoint: Point,
    control2: BasicPoint,
    control1: BasicPoint,
    endPoint: Point,
    startWidth: number,
    endWidth: number
  );

  /**
   * @method length
   * @description 计算贝塞尔曲线的近似长度
   * @returns {number} 曲线长度
   */
  length(): number;

  /**
   * @private
   * @method point
   * @description 计算贝塞尔曲线上的点
   */
  private point;
}

/**
 * @class SignatureEventTarget
 * @description 签名事件目标类，封装事件处理功能
 */
export declare class SignatureEventTarget {
  /** 事件目标实例 */
  private _et;

  /**
   * @constructor
   */
  constructor();

  /**
   * @method addEventListener
   * @description 添加事件监听器
   * @param {string} type - 事件类型
   * @param {EventListenerOrEventListenerObject | null} listener - 事件监听器
   * @param {boolean | AddEventListenerOptions} [options] - 事件监听选项
   */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @method dispatchEvent
   * @description 分发事件
   * @param {Event} event - 要分发的事件
   * @returns {boolean} 事件是否被取消
   */
  dispatchEvent(event: Event): boolean;

  /**
   * @method removeEventListener
   * @description 移除事件监听器
   * @param {string} type - 事件类型
   * @param {EventListenerOrEventListenerObject | null} callback - 事件回调
   * @param {boolean | EventListenerOptions} [options] - 事件监听选项
   */
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void;
}

/**
 * @interface SignatureEvent
 * @description 签名事件接口，封装签名相关事件数据
 */
export interface SignatureEvent {
  /** 原始事件对象 */
  event: MouseEvent | TouchEvent | PointerEvent;
  /** 事件类型 */
  type: string;
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 压力值 */
  pressure: number;
}

/**
 * @interface FromDataOptions
 * @description 从数据加载签名的选项
 */
export interface FromDataOptions {
  /** 是否清除现有内容 */
  clear?: boolean;
}

/**
 * @interface ToSVGOptions
 * @description 转换为SVG的选项
 */
export interface ToSVGOptions {
  /** 是否包含背景颜色 */
  includeBackgroundColor?: boolean;
}

/**
 * @interface PointGroupOptions
 * @description 点组的选项
 */
export interface PointGroupOptions {
  /** 点的大小 */
  dotSize: number;
  /** 最小宽度 */
  minWidth: number;
  /** 最大宽度 */
  maxWidth: number;
  /** 画笔颜色 */
  penColor: string;
  /** 速度过滤权重 */
  velocityFilterWeight: number;

  /**
   * 线条的全局合成操作
   * 默认值: 'source-over'
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
   */
  compositeOperation: GlobalCompositeOperation;
}

/**
 * @interface Options
 * @description 签名板选项
 */
export interface Options extends Partial<PointGroupOptions> {
  /** 最小距离，小于此距离的点将被忽略 */
  minDistance?: number;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 节流时间 */
  throttle?: number;
  /** 缩放 */
  scale?: number;
  /** Canvas上下文选项 */
  canvasContextOptions?: Partial<CanvasRenderingContext2DSettings>;
}

/**
 * @interface PointGroup
 * @description 点组，表示一组点及其绘制选项
 */
export interface PointGroup extends PointGroupOptions {
  /** 点集合 */
  points: BasicPoint[];
}

/**
 * @interface ActionControlsConfig
 * @description 操作控制配置项
 */
export interface ActionControlsConfig {
  /** 是否显示导出按钮 */
  export: boolean;
  /** 是否显示清除按钮 */
  clear: boolean;
  /** 是否显示撤销按钮 */
  undo: boolean;
  /** 是否显示重做按钮 */
  redo: boolean;
}

/**
 * @interface ConfigControlsConfig
 * @description 配置控制配置项
 */
export interface ConfigControlsConfig {
  /** 是否显示画笔颜色控制 */
  penColor: boolean;
  /** 是否显示背景颜色控制 */
  backgroundColor: boolean;
  /** 是否显示线条宽度控制 */
  lineWidth: boolean;
}

export interface ExportConfig {
  apiUrl: string;
  method: "POST" | "GET";
  headers: Array<{
    key: string;
    value: string;
  }>;
  body: Array<{
    key: string;
    value: string;
  }>;
}

/**
 * @interface Option
 * @description 签名板完整配置项
 */
export interface Option {
  /** 画笔颜色 */ penColor: string;
  /** 最小线宽 */
  minWidth: number;
  /** 最大线宽 */
  maxWidth?: number;
  /** 点大小 */
  dotSize?: number;
  /** 速度过滤权重 */
  velocityFilterWeight: number;
  /** 最小距离 */
  minDistance: number;
  /** 背景颜色 */
  backgroundColor: string;
  /** 节流时间 */
  throttle: number;
  /** 操作控制配置 */
  actionControls: ActionControlsConfig;
  /** 导出类型 */
  exportType: "systemInterface" | "customInterface";
  /** 配置控制配置 */
  configControls: ConfigControlsConfig;
  /** 导出配置 */
  exportConfig: ExportConfig;
}

/**
 * @function throttle
 * @description 函数节流，限制函数的执行频率
 * @param {Function} fn - 要节流的函数
 * @param {number} [wait=250] - 节流等待时间(毫秒)
 * @returns {Function} 节流后的函数
 */
export declare function throttle(fn: (...args: any[]) => any, wait?: number): (this: any, ...args: any[]) => any;

export interface Data {
  penWidth: number;
  dotSize: number;
}

export interface DataChart {
  penWidth: number;
}
