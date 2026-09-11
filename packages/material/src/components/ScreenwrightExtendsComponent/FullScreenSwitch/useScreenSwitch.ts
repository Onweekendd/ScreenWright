import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

export const useScreenSwitch = (options: ComponentType) => {
  const { isBuild, width, height, option } = useBaseData(options);

  const contentStyle = computed((): CSSProperties => {
    return {
      pointerEvents: isBuild.value ? "none" : "auto",
      width: width + "px",
      height: height + "px",
    };
  });

  const unFullScreenImg = computed((): string => {
    return option.value.unFullScreenImg
      ? setMinioUrl(option.value.unFullScreenImg)
      : "";
  });

  const fullScreenImg = computed((): string => {
    return option.value.fullScreenImg
      ? setMinioUrl(option.value.fullScreenImg)
      : "";
  });

  // 点击操作
  const isFullScreen = ref<boolean>(false);
  const handleClick = () => {
    isFullScreen.value = !isFullScreen.value;
    if (isFullScreen.value) {
      // 进入全屏模式，兼容不同浏览器
      const docElm = document.documentElement;
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      } else if ((docElm as any).mozRequestFullScreen) {
        // Firefox
        (docElm as any).mozRequestFullScreen();
      } else if ((docElm as any).webkitRequestFullscreen) {
        // Chrome, Safari
        (docElm as any).webkitRequestFullscreen();
      } else if ((docElm as any).msRequestFullscreen) {
        // IE/Edge
        (docElm as any).msRequestFullscreen();
      }
    } else {
      // 退出全屏模式，兼容不同浏览器
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        // Firefox
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) {
        // Chrome, Safari
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        // IE/Edge
        (document as any).msExitFullscreen();
      }
    }
  };

  return {
    contentStyle,
    unFullScreenImg,
    fullScreenImg,
    isFullScreen,
    handleClick,
  };
};
