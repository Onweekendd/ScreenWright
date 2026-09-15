import { computed, type CSSProperties, type Ref } from "vue";

export interface TimerShaftStyleOptions {
  option: Ref<Record<string, any>>;
  stepBodyDom: Ref<HTMLElement | null>;
}

export const useTimerShaftStyle = (options: TimerShaftStyleOptions) => {
  const { option, stepBodyDom } = options;

  // 默认字体样式
  const styleDefaultFont = computed<CSSProperties>(() => {
    return {
      color: option.value.defaultObj.fontColor,
      fontSize: `${option.value.defaultObj.fontSize || 12}px`,
      fontWeight: option.value.defaultObj.fontWeight,
      fontFamily: option.value.defaultObj.fontFamily,
      fontStyle: option.value.defaultObj.fontStyle,
      textShadow: option.value.defaultObj.isTextShadow
        ? `${option.value.defaultObj.textShadow.color} ${option.value.defaultObj.textShadow.x || 0}px ${
            option.value.defaultObj.textShadow.y || 0
          }px ${option.value.defaultObj.textShadow.blur}px`
        : "none",
      transform: `translate(-50%, ${option.value.defaultObj.textTranslateY || 0}px)`
    };
  });

  // 高亮字体样式
  const styleActiveFont = computed<CSSProperties>(() => {
    return {
      color: option.value.activeObj.fontColor,
      fontSize: `${option.value.activeObj.fontSize || 12}px`,
      fontWeight: option.value.activeObj.fontWeight,
      fontFamily: option.value.activeObj.fontFamily,
      fontStyle: option.value.activeObj.fontStyle,
      textShadow: option.value.activeObj.isTextShadow
        ? `${option.value.activeObj.textShadow.color} ${option.value.activeObj.textShadow.x || 0}px ${
            option.value.activeObj.textShadow.y || 0
          }px ${option.value.activeObj.textShadow.blur}px`
        : "none",
      transform: `translate(-50%, ${option.value.activeObj.textTranslateY || 0}px)`
    };
  });

  // 初始化样式
  const initStyle = () => {
    const { defaultObj, activeObj } = option.value;
    const bodyRefDom = stepBodyDom.value;
    if (!bodyRefDom) return;

    const listRefDom = bodyRefDom.children[0].children[0] as HTMLElement;

    // 样式设置函数
    const setStyleProperty = (styleName: string, styleValue: string, unit = "", type = "list") => {
      const obj = type === "layout" ? option.value : styleName.includes("Active") ? activeObj : defaultObj;
      const refDom = type === "layout" ? bodyRefDom : listRefDom;

      if (styleName.includes("Color")) {
        const rgx = /^rgba\(((,?\s*\d+){3}).+$/;
        const colorSuffixes = ["10", "08", "05"];
        colorSuffixes.forEach((num) => {
          refDom.style.setProperty(
            `--${styleName}${num === "10" ? "" : num}`,
            obj[styleValue].replace(rgx, `rgba($1,${parseFloat(num) / 10})`)
          );
        });
      } else {
        refDom.style.setProperty(`--${styleName}`, obj[styleValue] + unit);
      }
    };

    // 设置样式
    setStyleProperty("lineHeight", "lineHeight", "px", "layout");
    setStyleProperty("lineBg", "lineColor", "", "layout");

    setStyleProperty("defaultColor", "cursorColor");
    setStyleProperty("defaultSize", "cursorSize", "px");

    setStyleProperty("ActiveColor", "borderColor");
    setStyleProperty("ActiveBg", "cursorColor");
    setStyleProperty("ActiveSize", "cursorSize", "px");
  };

  return {
    styleDefaultFont,
    styleActiveFont,
    initStyle
  };
};
