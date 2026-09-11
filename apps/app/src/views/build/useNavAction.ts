import { computed, onBeforeUnmount, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { ElMessage } from "element-plus";

import { downFile } from "@/utils/config";
import { handleMessageBox } from "@/utils/utils";
import { useCustomAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";

import { useCommandHistory } from "./command/useCommandHistory";
import { useAlignmentWasm } from "./components/buildRender/hooks/useAlignmentWasm";
export enum NavListType {
  Component = "component", // 组件库
  MaterialLibrary = "materialLibrary" // 素材库
}

// 处理 侧边栏和配置栏的显示隐藏宽度变化
export const useNavAction = createGlobalState(() => {
  const { canUndo, canRedo, undo, redo, clearHistory: clearHistoryCommand } = useCommandHistory();
  const { resetCustomAnimationOnPanelChange } = useCustomAnimationData();
  const { resetStatusAnimationOnPanelChange } = useStatusAnimation();
  const { resetAlignmentLines } = useAlignmentWasm();
  const sideShow = ref(true);
  const configShow = ref(true);
  const projectFilterShow = ref(false); // 全局项目过滤器
  const globalCallbackManagerShow = ref(false); // 全局回调管理

  // ---- 左右面板宽度：可拖拽调节，clamp + 本地持久化 ----
  const SIDE_MIN = 160;
  const SIDE_MAX = 520;
  const CONFIG_MIN = 280;
  const CONFIG_MAX = 640;
  const SIDE_KEY = "sw-build-side-width";
  const CONFIG_KEY = "sw-build-config-width";

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));
  const readStored = (key: string, fallback: number) => {
    try {
      const n = Number(window.localStorage.getItem(key));
      return Number.isFinite(n) && n > 0 ? n : fallback;
    } catch {
      return fallback;
    }
  };

  const sideWidthPx = ref(clamp(readStored(SIDE_KEY, 196), SIDE_MIN, SIDE_MAX));
  const configWidthPx = ref(clamp(readStored(CONFIG_KEY, 340), CONFIG_MIN, CONFIG_MAX));

  const setSideWidth = (px: number) => {
    sideWidthPx.value = clamp(px, SIDE_MIN, SIDE_MAX);
    try {
      window.localStorage.setItem(SIDE_KEY, String(sideWidthPx.value));
    } catch {
      /* localStorage 不可用时忽略 */
    }
  };
  const setConfigWidth = (px: number) => {
    configWidthPx.value = clamp(px, CONFIG_MIN, CONFIG_MAX);
    try {
      window.localStorage.setItem(CONFIG_KEY, String(configWidthPx.value));
    } catch {
      /* localStorage 不可用时忽略 */
    }
  };

  const configWidth = computed(() => (configShow.value ? `${configWidthPx.value}px` : "0px"));
  const sideWidth = computed(() => (sideShow.value ? `${sideWidthPx.value}px` : "0px"));
  const navListType = ref<NavListType>(NavListType.Component); // 导航列表类型
  const configStyle = computed(() => ({ width: configWidth.value }));

  const containerStyle = computed(() => ({
    width: `calc(100% - ${sideWidth.value} - ${configWidth.value})`
  }));

  const sideStyle = computed(() => ({ width: sideWidth.value }));

  const handleSideShow = () => {
    sideShow.value = !sideShow.value;
  };
  const handleConfigShow = () => {
    configShow.value = !configShow.value;
  };
  // 导出图片
  const handleExportImage = async () => {
    const isExport = await handleMessageBox("是否导出大屏图片？", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (!isExport) {
      return;
    }

    const dom = document.getElementById("go-chart-edit-content");
    if (!dom) {
      return;
    }

    (window as any)
      .html2canvas(dom, {
        useCORS: true,
        backgroundColor: null,
        allowTaint: true // 注意：此配置可能导致 canvas 污染，建议根据前文跨域方案调整
      })
      .then(async (canvas: HTMLCanvasElement) => {
        // 1. 检测 canvas 是否有效（隐性失败）
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
          throw new Error("html2canvas 返回无效的 canvas 对象");
        }

        try {
          // 2. 检测 toDataURL 是否失败（常见于跨域污染）
          const dataUrl = canvas.toDataURL("image/jpeg");
          if (!dataUrl || dataUrl === "data:,") {
            throw new Error("canvas.toDataURL 生成失败（可能存在跨域污染）");
          }

          // 3. 后续正常处理逻辑
          const fileName = new Date().getTime() + ".jpg";
          downFile(dataUrl, fileName);
          ElMessage.success("图片处理成功");
        } catch (innerError) {
          console.error("html2canvas截图处理失败：", innerError);
          ElMessage.error("图片处理失败");
        }
      })
      .catch((error: Error) => {
        console.error("html2canvas 执行失败：", error);
      });
  };
  const clearHistory = () => {
    clearHistoryCommand();
    resetCustomAnimationOnPanelChange();
    resetStatusAnimationOnPanelChange();
    resetAlignmentLines();
  };
  onBeforeUnmount(() => {
    navListType.value = NavListType.Component; // 重置导航列表类型
  });

  return {
    canUndo,
    canRedo,
    sideStyle,
    sideShow,
    configShow,
    configStyle,
    containerStyle,
    sideWidthPx,
    configWidthPx,
    setSideWidth,
    setConfigWidth,
    navListType,
    projectFilterShow,
    globalCallbackManagerShow,
    handleConfigShow,
    handleSideShow,
    handleExportImage,
    undo,
    redo,
    clearHistory
  };
});
