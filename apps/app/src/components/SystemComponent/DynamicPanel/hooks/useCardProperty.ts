import type { Ref } from "vue";

import { setMinioUrl } from "@/utils/config";
import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";

import { setAniStyle as utilSetAniStyle } from "../util";

/**
 * 动态面板卡片属性管理钩子
 * 负责处理卡片模式下的属性设置和样式管理
 */
export function useCardProperty({
  dynamicPanel,
  panelViewCard,
  rotationType
}: {
  /** 动态面板配置 */
  dynamicPanel: DynamicPanelProps;
  /** 卡片面板视图引用 */
  panelViewCard: Ref<HTMLElement | null>;
  /** 轮播类型 */
  rotationType: Ref<string | false>;
}) {
  /**
   * 设置卡片动画样式
   * @param item - 卡片项配置数据
   * @returns 样式对象
   */
  const setAniStyle = (item: any) => {
    return utilSetAniStyle(item, setMinioUrl);
  };

  /**
   * 检查是否为卡片模式
   * @returns 如果是卡片模式返回true
   */
  const isCardMode = (): boolean => {
    return rotationType.value === "card";
  };

  /**
   * 检查是否为普通轮播模式
   * @returns 如果是普通模式返回true
   */
  const isNormalMode = (): boolean => {
    return rotationType.value === "normal";
  };

  /**
   * 检查面板视图是否可用
   * @returns 如果可用返回true
   */
  const isPanelViewAvailable = (): boolean => {
    return !!panelViewCard.value;
  };

  /**
   * 获取配置项的值
   * @param field - 配置项字段名
   * @returns 配置项的值
   */
  const getOptionValue = (field: string): any => {
    if (!dynamicPanel.option) return undefined;
    return dynamicPanel.option[field as keyof typeof dynamicPanel.option];
  };

  /**
   * 设置CSS变量
   * @param name - CSS变量名
   * @param value - CSS变量值
   */
  const setCssVariable = (name: string, value: string): void => {
    if (!panelViewCard.value) return;
    panelViewCard.value.style.setProperty(name, value);
  };

  /**
   * 处理TranslateX-l（左侧位移）属性
   * @param field - 字段名
   */
  const handleTranslateXLeft = (field: string): void => {
    const actualField = field.replace("-l", "");
    const value = getOptionValue(actualField) || 0;
    setCssVariable(`--${field}`, `-${value}px`);
  };

  /**
   * 处理TranslateX（右侧位移）属性
   * @param field - 字段名
   */
  const handleTranslateXRight = (field: string): void => {
    const value = getOptionValue(field) || 0;
    setCssVariable(`--${field}-r`, `${value}px`);
  };

  /**
   * 处理TranslateY（垂直位移）属性
   * @param field - 字段名
   */
  const handleTranslateY = (field: string): void => {
    const value = getOptionValue(field) || 0;
    setCssVariable(`--${field}`, `${value}px`);
  };

  /**
   * 处理Scale（缩放）属性
   * @param field - 字段名
   */
  const handleScale = (field: string): void => {
    const value = getOptionValue(field) || 1;
    setCssVariable(`--${field}`, `${value}`);
  };

  /**
   * 处理卡片不透明度属性
   * 设置三张卡片的不透明度
   */
  const handleCardOpacity = (): void => {
    const card1Opacity = dynamicPanel.option?.card1Opacity || 1;
    const card2Opacity = dynamicPanel.option?.card2Opacity || 0.25;
    const isCard3Show = getOptionValue("isCard3Show");
    const card3Opacity = isCard3Show ? 0 : dynamicPanel.option?.card3Opacity || 0.1;

    setCssVariable("--card1Opacity", `${card1Opacity}`);
    setCssVariable("--card2Opacity", `${card2Opacity}`);
    setCssVariable("--card3Opacity", `${card3Opacity}`);
  };

  /**
   * 处理卡片模式下的单个属性
   * @param field - 属性字段名
   */
  const handleCardModeProperty = (field: string): void => {
    if (!isPanelViewAvailable()) return;
    if (!dynamicPanel.option) return;

    if (field.includes("TranslateX-l")) {
      handleTranslateXLeft(field);
    } else if (field.includes("TranslateX")) {
      handleTranslateXRight(field);
    } else if (field.includes("TranslateY")) {
      handleTranslateY(field);
    } else if (field.includes("Scale")) {
      handleScale(field);
    } else if (field === "isCard3Show") {
      handleCardOpacity();
    }
  };

  /**
   * 重置位移属性为0
   * @param field - 属性字段名
   */
  const resetTranslateProperty = (field: string): void => {
    if (!field.includes("Translate")) return;

    setCssVariable(`--${field}`, "0");

    if (field === "card2TranslateX" || field === "card3TranslateX") {
      setCssVariable(`--${field}-r`, "0");
    }
  };

  /**
   * 重置缩放属性为1
   * @param field - 属性字段名
   */
  const resetScaleProperty = (field: string): void => {
    if (!field.includes("Scale")) return;
    setCssVariable(`--${field}`, "1");
  };

  /**
   * 重置不透明度属性
   */
  const resetOpacityProperty = (): void => {
    setCssVariable("--card1Opacity", "1");
    setCssVariable("--card2Opacity", "0");
    setCssVariable("--card3Opacity", "0");
  };

  /**
   * 处理普通模式下的单个属性
   * @param field - 属性字段名
   */
  const handleNormalModeProperty = (field: string): void => {
    if (!isPanelViewAvailable()) return;

    resetTranslateProperty(field);
    resetScaleProperty(field);

    if (field === "isCard3Show") {
      resetOpacityProperty();
    }
  };

  /**
   * 更新卡片属性
   * 设置卡片位置、大小、透明度等CSS变量
   * @param properties - 需要更新的属性数组
   */
  const updateProperty = (
    properties: string[] = [
      "card1TranslateY",
      "card2TranslateY",
      "card3TranslateY",
      "card2TranslateX-l",
      "card2TranslateX",
      "card3TranslateX-l",
      "card3TranslateX",
      "card1ScaleX",
      "card1ScaleY",
      "card2ScaleX",
      "card2ScaleY",
      "card3ScaleX",
      "card3ScaleY",
      "isCard3Show",
      "card1Opacity",
      "card2Opacity",
      "card3Opacity"
    ]
  ): void => {
    if (!isPanelViewAvailable()) return;

    if (isCardMode()) {
      // 卡片模式：设置具体的属性值
      properties.forEach((field) => {
        handleCardModeProperty(field);
      });
    } else if (isNormalMode()) {
      // 普通模式：重置所有属性
      properties.forEach((field) => {
        handleNormalModeProperty(field);
      });
    }
  };

  return {
    setAniStyle,
    updateProperty
  };
}
