import type { Ref } from "vue";
import { computed } from "vue";

import { setMinioUrl } from "@/utils/config";
import type {
  DynamicPanel,
  DynamicPanelProps
} from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";

/**
 * 动态面板样式计算钩子
 * 负责计算面板的各种样式属性
 */
export function useStyles({
  dynamicPanel,
  instance,
  isBuild
}: {
  /** 动态面板配置 */
  dynamicPanel: DynamicPanelProps;
  /** 动态面板实例引用 */
  instance: Ref<InstanceType<new () => DynamicPanel> | undefined>;
  /** 是否为构建模式 */
  isBuild: Ref<boolean>;
}) {
  /**
   * 计算当前激活状态
   * 获取当前激活的面板状态数据
   */
  const activeStatus = computed<PanelState | null>({
    get: () => {
      if (!instance.value) {
        return null;
      }

      const { panelData, activeStatusId } = instance.value;
      if (!activeStatusId) {
        return null;
      }

      const activeStatus = panelData.find((item) => item.id === activeStatusId);
      if (!activeStatus) {
        return null;
      }

      return activeStatus;
    },
    set: () => {}
  });

  /**
   * 计算箭头宽度
   * @returns 箭头宽度的数值
   */
  const getArrowWidth = (): number => {
    return parseFloat(String(dynamicPanel.option?.arrowWidth || 0));
  };

  /**
   * 计算箭头容器样式
   * 根据配置生成箭头容器的定位和样式
   * @returns 样式对象
   */
  const arrowContainStyle = computed(() => {
    if (!dynamicPanel.option) return {};

    const arrowWidth = getArrowWidth();

    return {
      position: "absolute" as const,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: `calc(100% + ${arrowWidth * 2}px)`,
      height: "100%",
      top: 0,
      left: `-${arrowWidth}px`
    };
  });

  /**
   * 生成箭头样式对象
   * @param width - 箭头宽度
   * @param height - 箭头高度
   * @param imageUrl - 背景图片URL
   * @returns 样式对象
   */
  const createArrowStyle = (width: number, height: number, imageUrl?: string) => {
    return {
      width: `${width}px`,
      height: `${height}px`,
      backgroundImage: imageUrl ? `url(${setMinioUrl(imageUrl)})` : "",
      backgroundRepeat: "no-repeat" as const,
      backgroundSize: "contain" as const,
      pointerEvents: "visible" as const,
      cursor: "pointer"
    };
  };

  /**
   * 计算左侧箭头样式
   * 根据配置生成左侧箭头的大小和背景图片
   * @returns 样式对象
   */
  const arrowLStyle = computed(() => {
    if (!dynamicPanel.option) return {};

    const { arrowWidth = 0, arrowHeight = 0, imgLeft } = dynamicPanel.option;
    return createArrowStyle(Number(arrowWidth), Number(arrowHeight), imgLeft);
  });

  /**
   * 计算右侧箭头样式
   * 根据配置生成右侧箭头的大小和背景图片
   * @returns 样式对象
   */
  const arrowRStyle = computed(() => {
    if (!dynamicPanel.option) return {};

    const { arrowWidth = 0, arrowHeight = 0, imgRight } = dynamicPanel.option;
    return createArrowStyle(Number(arrowWidth), Number(arrowHeight), imgRight);
  });

  /**
   * 计算透视原点位置
   * @param originGrid - 原点网格配置
   * @returns 包含水平和垂直位置的对象
   */
  const calculatePerspectiveOrigin = (originGrid?: unknown): { left: string; top: string } => {
    // 默认中心点
    let left = "center";
    let top = "center";

    // 处理originGrid，可能是字符串或对象
    if (originGrid && typeof originGrid !== "string") {
      const grid = originGrid as {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
      };
      left = grid.left === 0 ? "left" : grid.right === 0 ? "right" : "center";
      top = grid.top === 0 ? "top" : grid.bottom === 0 ? "bottom" : "center";
    }

    return { left, top };
  };

  /**
   * 计算3D透视样式
   * 根据配置生成3D透视效果和透视原点
   * @returns 样式对象
   */
  const setPerspective = computed(() => {
    if (!dynamicPanel.option) return {};

    const { perspective = 0, originGrid } = dynamicPanel.option;
    const origin = calculatePerspectiveOrigin(originGrid);

    return {
      perspective: `${perspective > 0 ? perspective + "px" : "none"}`,
      perspectiveOrigin: `${origin.left} ${origin.top}`
    };
  });

  /**
   * 构建3D变换字符串
   * @param options - 变换选项
   * @returns 变换CSS字符串
   */
  const buildTransform3d = (options: {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    scaleX?: number;
    scaleY?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    skewX?: number;
    skewY?: number;
  }): string => {
    const {
      translateX = 0,
      translateY = 0,
      translateZ = 0,
      scaleX = 100,
      scaleY = 100,
      rotateX = 0,
      rotateY = 0,
      rotateZ = 0,
      skewX = 0,
      skewY = 0
    } = options;

    return `translate3d(${translateX}px, ${translateY}px, ${translateZ}px)
            scaleX(${parseInt(String(scaleX)) * 0.01})
            scaleY(${parseInt(String(scaleY)) * 0.01})
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            rotateZ(${rotateZ}deg)
            skewX(${skewX}deg)
            skewY(${skewY}deg)`;
  };

  /**
   * 计算3D变换样式
   * 根据配置生成3D变换效果，包括位移、缩放、旋转和倾斜
   * @returns 样式对象
   */
  const setTranslate3d = computed(() => {
    if (!dynamicPanel.option) return {};

    const { translateX, translateY, translateZ, scaleX, scaleY, rotateX, rotateY, rotateZ, skewX, skewY } =
      dynamicPanel.option;

    return {
      transform: buildTransform3d({
        translateX,
        translateY,
        translateZ,
        scaleX,
        scaleY,
        rotateX,
        rotateY,
        rotateZ,
        skewX,
        skewY
      })
    };
  });

  /**
   * 构建背景样式对象
   * @param backgroundColor - 背景颜色
   * @param backgroundImage - 背景图片URL
   * @param enableScroll - 是否启用滚动
   * @param gestureSliding - 是否启用手势滑动
   * @returns 样式对象
   */
  const buildBackgroundStyle = (
    backgroundColor?: string,
    backgroundImage?: string,
    enableScroll?: boolean,
    gestureSliding?: boolean
  ): Record<string, string> => {
    const style: Record<string, string> = {
      backgroundColor: backgroundColor || "transparent",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "100% 100%",
      pointerEvents: !isBuild.value && (enableScroll || gestureSliding) ? "auto" : "",
      overflow: enableScroll ? "scroll" : "hidden"
    };

    if (backgroundImage) {
      style.backgroundImage = `url(${setMinioUrl(backgroundImage)})`;
    }

    return style;
  };

  /**
   * 计算当前面板背景样式
   * 根据当前激活状态生成背景颜色和图片
   * @returns 样式对象
   */
  const bgStyle = computed(() => {
    if (!activeStatus.value) return {};

    return buildBackgroundStyle(
      activeStatus.value.backgroundColor,
      activeStatus.value.showBackgroundImage ? activeStatus.value.backgroundImage : undefined,
      dynamicPanel.option?.enableScroll,
      dynamicPanel.option?.gestureSliding
    );
  });

  /**
   * 计算面板样式
   * 根据当前激活状态生成面板的背景样式
   * @returns 样式对象
   */
  const panelStyle = computed(() => {
    if (!activeStatus.value) {
      return {};
    }

    return {
      backgroundColor: activeStatus.value.backgroundColor,
      backgroundImage: activeStatus.value.backgroundImage
        ? `url(${setMinioUrl(activeStatus.value.backgroundImage)})`
        : ""
    };
  });

  return {
    activeStatus,
    arrowContainStyle,
    arrowLStyle,
    arrowRStyle,
    setPerspective,
    setTranslate3d,
    bgStyle,
    panelStyle
  };
}
