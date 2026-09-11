import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed } from "vue";

export const useMaskLayer = (options: ComponentType) => {
  const { option, height } = useBaseData(options);
  const maskLayerStyle = computed<CSSProperties>(() => {
    return {
      pointerEvents: option.value.pointerEvents ? "none" : "auto",
    };
  });

  const getMarkStyle = computed<CSSProperties>(() => {
    let returnStyle: CSSProperties = {};
    if (option.value && option.value.markType) {
      switch (option.value.markType) {
        case "linearGradient":
          returnStyle = {
            background: `linear-gradient(${option.value.linearGradient?.markPosition || 0}deg, ${
              option.value.linearGradient?.markColor
            } 0%, ${option.value.linearGradient?.markColor} ${
              option.value.linearGradient?.markRadius || 0
            }%, transparent 100%)`,
            opacity: `${option.value.linearGradient?.markOpacity / 100}`,
          };
          break;
        case "radioactiveGradation":
          {
            let bm = "";
            if (option.value.radioactiveGradation.showLengthWidthRatio) {
              if (option.value.radioactiveGradation.lengthWidthRatio < 0) {
                bm = `radial-gradient(${
                  1 / (1 + option.value.radioactiveGradation.lengthWidthRatio)
                }px 1px, transparent ${
                  option.value.radioactiveGradation?.markOpacityRadius
                    ? (option.value.radioactiveGradation?.markOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px, ${option.value.radioactiveGradation?.markColor} ${
                  option.value.radioactiveGradation?.markUnOpacityRadius
                    ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px)`;
              } else if (
                option.value.radioactiveGradation.lengthWidthRatio === 0
              ) {
                bm = `radial-gradient(1px 1px, transparent ${
                  option.value.radioactiveGradation?.markOpacityRadius
                    ? (option.value.radioactiveGradation?.markOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px, ${option.value.radioactiveGradation?.markColor} ${
                  option.value.radioactiveGradation?.markUnOpacityRadius
                    ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px)`;
              } else {
                bm = `radial-gradient(1px ${
                  1 / (1 - option.value.radioactiveGradation.lengthWidthRatio)
                }px, transparent ${
                  option.value.radioactiveGradation?.markOpacityRadius
                    ? (option.value.radioactiveGradation?.markOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px, ${option.value.radioactiveGradation?.markColor} ${
                  option.value.radioactiveGradation?.markUnOpacityRadius
                    ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px)`;
              }
            } else {
              bm = `radial-gradient(transparent ${
                option.value.radioactiveGradation?.markOpacityRadius
                  ? (option.value.radioactiveGradation?.markOpacityRadius /
                      100) *
                    height.value
                  : 0
              }px, ${option.value.radioactiveGradation?.markColor} ${
                option.value.radioactiveGradation?.markUnOpacityRadius
                  ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                      100) *
                    height.value
                  : 0
              }px)`;
            }
            returnStyle = {
              "background-image": bm,
              opacity: `${option.value.radioactiveGradation?.markOpacity / 100}`,
            };
          }

          break;
      }
    }

    return returnStyle;
  });

  return {
    maskLayerStyle,
    getMarkStyle,
  };
};
