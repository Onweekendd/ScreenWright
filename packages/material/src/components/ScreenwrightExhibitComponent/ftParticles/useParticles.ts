import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { debounce } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import { particlesJS } from "./particles";

// sw-build-manager__container
export const useParticles = (options: ComponentType) => {
  const { option } = useBaseData(options);
  const particlesInstance = ref<any>(null);
  const screenScale = ref<number>(1);
  const particlesJsRef = ref<HTMLElement | null>(null);

  const particlesStyle = computed<CSSProperties>(() => {
    return {
      backgroundColor: `${option.value.backgroundColor ? option.value.backgroundColor : "#892b2b"}`,
    };
  });

  const setParticlesScale = () => {
    screenScale.value =
      getScaleValueFromContent(".sw-build-manager__container") ?? 1;
    if (particlesInstance.value) {
      particlesInstance.value.updateParams(option.value, {
        screenScale: screenScale.value,
      });
    }
  };

  const debouncedUpdateParticles = debounce(() => {
    if (particlesInstance.value) {
      particlesInstance.value.updateParams(option.value, {
        screenScale: screenScale.value,
      });
    }
  }, 300);

  const getScaleValueFromContent = (selector: string) => {
    const content = document.querySelector(selector);
    if (content) {
      // @ts-ignore
      const transformValue = /** @type {string} */ content.style.transform;
      const scaleMatch = transformValue.match(/scale\(([^)]+)\)/);
      return scaleMatch ? parseFloat(scaleMatch[1]) : null;
    }
    return null;
  };

  const initParticles = () => {
    if (particlesInstance.value) {
      particlesInstance.value.destroy();
    }
    if (particlesJsRef.value) {
      const el =
        particlesJsRef.value instanceof HTMLElement
          ? particlesJsRef.value
          : particlesJsRef.value &&
              (particlesJsRef.value as any).$el instanceof HTMLElement
            ? (particlesJsRef.value as any).$el
            : null;
      if (el) {
        particlesInstance.value = particlesJS(el, option.value, {
          screenScale: screenScale.value,
        });
      }
    }
  };

  return {
    option,
    particlesInstance,
    screenScale,
    particlesStyle,
    particlesJsRef,
    setParticlesScale,
    debouncedUpdateParticles,
    initParticles,
  };
};
