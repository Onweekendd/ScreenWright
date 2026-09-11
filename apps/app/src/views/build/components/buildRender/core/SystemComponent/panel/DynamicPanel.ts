import { DataType } from "@/views/build/components/buildRender/type";

import { SystemBase } from "../SystemBase";
import type { PanelState, SystemComponentProps } from "../type";
import { PanelType } from "../type";

export enum customPositionTypeEnum {
  toLeft = "toLeft",
  toCenter = "toCenter",
  toRight = "toRight",
  toCenterTop = "toCenterTop",
  toCenterBottom = "toCenterBottom",
  toCustom = "toCustom"
}
export interface DynamicPanelOptions {
  /** @description 是否启用滚动 */
  enableScroll: boolean;

  /** @description 是否启用手势滑动 */
  gestureSliding: boolean;

  /** @description 是否开启轮播 */
  rotationShow: boolean;

  /** @description 轮播类型 */
  rotationType: string;

  /** @description 是否自动轮播 */
  autoRotation: boolean;

  /** @description 是否显示轮播图标 */
  arrowShow: boolean;

  /** @description 左侧图标 */
  imgLeft: string;

  /** @description 右侧图标 */
  imgRight: string;

  /** @description 图标宽度 */
  arrowWidth: number;

  /** @description 图标高度 */
  arrowHeight: number;

  /** @description 动画类型 */
  animationType: string;

  /** @description 间隔时长 */
  timingFunction: number;

  /** @description 中间卡片的X轴偏移 */
  card1TranslateX: number;

  /** @description 中间卡片的Y轴偏移 */
  card1TranslateY: number;

  /** @description 中间卡片的X轴缩放 */
  card1ScaleX: number;

  /** @description 中间卡片的Y轴缩放 */
  card1ScaleY: number;

  /** @description 中间卡片的透明度 */
  card1Opacity: number;

  /** @description 两侧卡片的X轴偏移 */
  card2TranslateX: number;

  /** @description 两侧卡片的Y轴偏移 */
  card2TranslateY: number;

  /** @description 两侧卡片的X轴缩放 */
  card2ScaleX: number;

  /** @description 两侧卡片的Y轴缩放 */
  card2ScaleY: number;

  /** @description 两侧卡片的透明度 */
  card2Opacity: number;

  /** @description 其他卡片的默认隐藏状态 */
  isCard3Show: boolean;

  /** @description 其他卡片的X轴偏移 */
  card3TranslateX: number;

  /** @description 其他卡片的Y轴偏移 */
  card3TranslateY: number;

  /** @description 其他卡片的X轴缩放 */
  card3ScaleX: number;

  /** @description 其他卡片的Y轴缩放 */
  card3ScaleY: number;

  /** @description 其他卡片的透明度 */
  card3Opacity: number;

  /** @description 是否切换状态初始化 */
  isSwitchStatusReload: boolean;

  /** @description 透视距离 */
  perspective: number;

  /** @description 视点位置的网格 */
  originGrid: string;

  /** @description 视点位置的X轴 */
  originX: number;

  /** @description 视点位置的Y轴 */
  originY: number;

  /** @description 绕X轴旋转 */
  rotateX: number;

  /** @description 绕Y轴旋转 */
  rotateY: number;

  /** @description 绕Z轴旋转 */
  rotateZ: number;

  /** @description X方向的斜切 */
  skewX: number;

  /** @description Y方向的斜切 */
  skewY: number;

  /** @description X轴缩放 */
  scaleX: number;

  /** @description Y轴缩放 */
  scaleY: number;

  /** @description X轴平移 */
  translateX: number;

  /** @description Y轴平移 */
  translateY: number;

  /** @description Z轴平移 */
  translateZ: number;

  /** @description 是否启用预加载 */
  isPreLoad: boolean;
  /** @description 是否启用自定义位置 */
  customPosition: boolean;
  /** @description 自定义位置 */
  customPositionType: customPositionTypeEnum;
  /** @description 自定义位置的X轴 */
  customPositionX?: number;
  /** @description 自定义位置的Y轴 */
  customPositionY?: number;
  /** @description 自定义位置的左 */
  customPositionLeft?: number;
  /** @description 自定义位置的右 */
  customPositionRight?: number;
  /** @description 自定义位置的上 */
  customPositionTop?: number;
  /** @description 自定义位置的下 */
  customPositionBottom?: number;

  /** @description 最大缓存状态数量，0表示不使用缓存优化，默认5 */
  maxCacheSize?: number;
  /** @description 是否预加载相邻状态，默认true */
  preloadAdjacent?: boolean;
  /** @description 相邻状态数量，默认15 */
  adjacentCount?: number;

  /** @description 是否启用横向循环滚动 */
  enableHorizontalScroll?: boolean;
  /** @description 横向滚动速度 (像素/秒) */
  horizontalScrollSpeed?: number;
  /** @description 横向滚动方向  */
  horizontalScrollDirection?: "scrollLeft" | "scrollRight" | "scrollUp" | "scrollDown";
}

export interface DynamicPanelProps extends SystemComponentProps {
  /**
   * @description 动态面板配置
   */
  option: DynamicPanelOptions;
}

export interface DynamicPanelCustomProps {
  /** @description 自定义配置 */
  customConfig?: object;
  /** @description 是否选中新增的动态面板 */
  isSelectChart: boolean;
}

export const defaultDynamicPanelOptions: DynamicPanelOptions = {
  enableScroll: false,
  gestureSliding: false,
  rotationShow: false,
  rotationType: "",
  autoRotation: false,
  arrowShow: false,
  imgLeft: "version-test/assets/defaultImg/imgLeft.png",
  imgRight: "version-test/assets/defaultImg/imgRight.png",
  arrowWidth: 72,
  arrowHeight: 72,
  animationType: "opacity",
  timingFunction: 5,
  card1TranslateX: 0,
  card1TranslateY: 50,
  card1ScaleX: 1,
  card1ScaleY: 1,
  card1Opacity: 1,
  card2TranslateX: 200,
  card2TranslateY: 0,
  card2ScaleX: 1,
  card2ScaleY: 1,
  card2Opacity: 1,
  isCard3Show: true,
  card3TranslateX: 300,
  card3TranslateY: -50,
  card3ScaleX: 1,
  card3ScaleY: 1,
  card3Opacity: 1,
  isSwitchStatusReload: false,
  perspective: 0,
  originGrid: "center center",
  originX: 50,
  originY: 50,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  skewX: 0,
  skewY: 0,
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  isPreLoad: false,
  customPosition: false,
  customPositionType: customPositionTypeEnum.toCenter,
  maxCacheSize: 40,
  preloadAdjacent: true,
  adjacentCount: 15,
  enableHorizontalScroll: false,
  horizontalScrollSpeed: 50
};

class DynamicPanel extends SystemBase<DynamicPanelOptions> {
  options: DynamicPanelOptions = defaultDynamicPanelOptions;

  /**
   * @description 动态面板状态数据
   */
  panelData: PanelState[] = [];

  /**
   * @description 当前激活状态
   */
  activeStatusId: string | null = null;

  constructor() {
    const defaultBaseChartProps: SystemComponentProps<PanelType.dynamicPanel> & { groupName: string; type: string } = {
      component: {
        prop: PanelType.dynamicPanel,
        width: 400,
        height: 300,
        name: "动态面板"
      },
      left: 0,
      top: 0,
      id: Date.now(),
      name: "动态面板",
      groupName: "动态面板",
      type: "dynamicPanel",
      img: "",
      data: [],
      yAxisType: "value",
      option: {},
      dataType: DataType.STATIC,
      dataRemark: [],
      listenArgs: [],
      openFilter: false,
      isLock: false,
      zIndex: 0,
      display: true,
      title: "",
      dataSource: {},
      events: [],
      cbArgs: [],
      panelData: [],
      activeStatusId: null,
      loadAnimation: {
        type: "",
        timingFunction: "",
        duration: 0,
        delay: 0
      }
    };
    super(defaultBaseChartProps);
  }
  init(dynamicPanelProps: DynamicPanelProps): void {
    this.updateBaseProps(dynamicPanelProps);

    this.options = dynamicPanelProps.option;
    this.panelData = dynamicPanelProps.panelData;

    if (this.panelData.length > 0) {
      this.activeStatusId = this.panelData[0].id;
    }
  }
  getOptions(): DynamicPanelOptions {
    return this.options;
  }
}

export { DynamicPanel };
