import {
  BaseName,
  request,
  setMinioUrl,
  useBaseData,
} from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import axios from "axios";
import { ElMessage } from "element-plus";
import { computed, ref, shallowRef } from "vue";

import type { AdvanceSignaturePad } from "./AdvanceSignaturePad";

interface ExportConfig {
  apiUrl: string;
  method: "POST" | "GET" | "PUT" | "DELETE";
  headers: Array<{ key: string; value: string }>;
  body: Array<{ key: string; value: string }>;
}

interface ActionControls {
  export: boolean;
  clear: boolean;
  undo: boolean;
  redo: boolean;
}

interface ConfigControls {
  penColor: boolean;
  backgroundColor: boolean;
  lineWidth: boolean;
}

interface SignatureOptions {
  scale: number;
  throttle: number;
  minWidth: number;
  dotSize: number;
  penColor: string;
  velocityFilterWeight: number;
  minDistance: number;
  backgroundColor: string;
  actionControls: ActionControls;
  configControls: ConfigControls;
  exportType: "systemInterface" | "base64" | "blob";
  exportConfig: ExportConfig;
  maxWidth?: number;
}

export const useSignature = (options: ComponentType) => {
  const { width, height, option, dataChart, encodes, handleEncode } =
    useBaseData(options);

  const containerWidth = ref<number>(0);
  const containerHeight = ref<number>(0);
  const initWidth = ref<number>(0);
  const initHeight = ref<number>(0);
  const advanceSignaturePad = shallowRef<AdvanceSignaturePad | null>(null);
  const screenScale = ref<number>(1);
  const container = ref<HTMLElement | null>(null);
  const encodeStatus = ref<boolean>(false);
  const maxWidth = ref<number>(0);
  const canUndo = ref(false);
  const canRedo = ref(false);
  const resizeObserver = ref<ResizeObserver | null>(null);
  const defaultOptions = ref<SignatureOptions>({
    scale: 1,
    throttle: 10,
    minWidth: 3,
    dotSize: 5,
    penColor: "#642cff",
    velocityFilterWeight: 0.2,
    minDistance: 5,
    backgroundColor: "rgba(0,0,0,0)",
    actionControls: {
      export: true,
      clear: true,
      undo: true,
      redo: true,
    },
    configControls: {
      penColor: true,
      backgroundColor: true,
      lineWidth: true,
    },
    exportType: "systemInterface",
    exportConfig: {
      apiUrl: "",
      method: "POST",
      headers: [],
      body: [],
    },
  });

  const componentOptions = computed<SignatureOptions>(() => {
    return {
      ...defaultOptions.value,
      scale: screenScale.value,
      maxWidth: maxWidth.value,
    };
  });

  const maxWidthConfig = computed<any>(() => {
    if (dataChart.value && dataChart.value.length > 0) {
      return dataChart.value[0].penWidth;
    } else {
      return null;
    }
  });

  const actionControlsConfig = computed(() => {
    return option.value && option.value.actionControls
      ? option.value.actionControls
      : {
          export: true,
          clear: true,
          undo: true,
          redo: true,
        };
  });

  const configControlsConfig = computed(() => {
    return option.value && option.value.configControls
      ? option.value.configControls
      : {
          penColor: true,
          backgroundColor: true,
          lineWidth: true,
          pointSize: true,
        };
  });

  const showOperationControls = computed(() => {
    const controls = actionControlsConfig.value;
    return controls.export || controls.clear || controls.undo || controls.redo;
  });

  const showConfigControls = computed(() => {
    const controls = configControlsConfig.value;
    return controls.penColor || controls.backgroundColor || controls.lineWidth;
  });

  // const canUndo = computed(() => {
  //   console.log(advanceSignaturePad.value, "advanceSignaturePad.value")
  //   // return advanceSignaturePad.value ? advanceSignaturePad.value.canUndo() : false
  // })
  // const canRedo = computed(() => {
  //   console.log(advanceSignaturePad.value, "advanceSignaturePad.value")
  //   return advanceSignaturePad.value ? advanceSignaturePad.value.canRedo() : false
  // })
  const renderWidth = computed(() => {
    return containerWidth.value > 0 ? containerWidth.value : initWidth.value;
  });
  const renderHeight = computed(() => {
    return containerHeight.value > 0 ? containerHeight.value : initHeight.value;
  });

  const getScaleValueFromContent = (content: HTMLDivElement) => {
    if (content) {
      // @ts-ignore
      const transformValue = /** @type {string} */ content.style.transform;
      const scaleMatch = transformValue.match(/scale\(([^)]+)\)/);
      return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    }
    return 1;
  };
  // 清除画布
  const clearCanvas = () => {
    if (!advanceSignaturePad.value) {
      return;
    }
    // Clear both the signature data and any loaded image
    advanceSignaturePad.value.clear();
    // Also clear the stored image URL and properties
    if (advanceSignaturePad.value.currentImageUrl) {
      advanceSignaturePad.value.currentImageUrl = null;
      advanceSignaturePad.value.currentImageProperties = null;
    }
  };

  const undoOperation = () => {
    if (!advanceSignaturePad.value) {
      return;
    }
    advanceSignaturePad.value.undo();
    canUndo.value = advanceSignaturePad.value
      ? advanceSignaturePad.value.canUndo()
      : false;
    canRedo.value = advanceSignaturePad.value
      ? advanceSignaturePad.value.canRedo()
      : false;
  };

  const redoOperation = () => {
    if (!advanceSignaturePad.value) {
      return;
    }
    advanceSignaturePad.value.redo();
    canUndo.value = advanceSignaturePad.value
      ? advanceSignaturePad.value.canUndo()
      : false;
    canRedo.value = advanceSignaturePad.value
      ? advanceSignaturePad.value.canRedo()
      : false;
  };

  const onTranslateImage = (info: any) => {
    const fullImageUrl = setMinioUrl(info.imageUrl);
    if (!advanceSignaturePad.value || !advanceSignaturePad.value.signaturePad) {
      return;
    }

    // Store the image URL for potential redraws (e.g., after canvas resize)
    advanceSignaturePad.value.currentImageUrl = fullImageUrl;

    // Create a new image element
    const image = new Image();
    // 设置跨域属性以避免canvas被污染
    image.crossOrigin = "anonymous";

    image.onload = () => {
      if (
        !advanceSignaturePad.value ||
        !advanceSignaturePad.value.signaturePad
      ) {
        return;
      }

      const canvas = advanceSignaturePad.value.signaturePad.canvas;
      const ctx = advanceSignaturePad.value.signaturePad._ctx;
      if (!ctx) {
        return;
      }

      // Calculate positions to center the image
      // const scale = componentOptions.value.scale || 1
      const maxWidth = canvas.width * 0.8; // Use 80% of canvas width
      const maxHeight = canvas.height * 0.8; // Use 80% of canvas height

      // Calculate scaled dimensions while maintaining aspect ratio
      let width = image.width;
      let height = image.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Calculate position to center the image
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      // Save current data if there's any drawing
      // This preserves existing drawings and undo history
      const currentData = advanceSignaturePad.value.toData();

      // Draw background if set
      ctx.fillStyle = componentOptions.value.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image centered
      ctx.drawImage(image, x, y, width, height);

      // Store image properties for redrawing
      // The image itself isn't added to the undo history
      advanceSignaturePad.value.currentImageProperties = {
        url: fullImageUrl,
        x,
        y,
        width,
        height,
        crossOrigin: "anonymous", // 保存crossOrigin属性
      };

      // Restore any drawing data without affecting undo history
      if (currentData.length > 0) {
        // Use fromData with clear:false to avoid affecting the undo stack
        advanceSignaturePad.value.fromData(currentData, { clear: false });
      }

      // Set isEmpty to false since we have an image
      if (advanceSignaturePad.value.signaturePad) {
        advanceSignaturePad.value.signaturePad._isEmpty = false;
      }
    };

    // 设置onerror处理，在加载失败时尝试不使用跨域加载
    image.onerror = () => {
      console.warn("Failed to load image with CORS. Attempting without CORS.");
      const fallbackImage = new Image();
      fallbackImage.onload = image.onload;
      fallbackImage.src = fullImageUrl;
    };

    image.src = fullImageUrl;
  };

  const processExportedImage = async (dataUrl: string) => {
    if (!advanceSignaturePad.value) {
      return;
    }

    const base64Data = dataUrl.split(",")[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a blob and then a file from the binary data
    const blob = new Blob([bytes], { type: "image/png" });
    const file = new File(
      [blob],
      `${Date.now() + "-" + options.id}-signature.png`,
      { type: "image/png" },
    );
    if (encodes.value.length === 0) {
      advanceSignaturePad.value.clear();
      ElMessage.warning("签名板未绑定弹幕组件，无法导出签名");
      return;
    }
    const simpleBarrageId = parseInt(
      encodes.value[0].actions[0].component[0].replace(
        /\$component\(|(\))/g,
        "",
      ),
    );

    const formData = new FormData();

    // 系统接口
    if (componentOptions.value.exportType === "systemInterface") {
      /**
       * @type {SignaturePadSaveObj}
       */
      const dataToAppend = {
        name: `${Date.now() + "-" + options.id}-signature.png`,
        layerScrollId: simpleBarrageId,
        layerSignId: options.id,
        image: file,
      };

      Object.entries(dataToAppend).forEach(([key, value]) => {
        console.log(key, value);

        if (typeof value === "number") {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      });
      try {
        const res: any = await request({
          url: `${BaseName.System}/sign/save`,
          method: "post",
          data: formData,
        });

        handleEncode({ signatureId: options.id, imageUrl: res.result.signUrl });

        advanceSignaturePad.value.clear();
      } catch (error) {
        console.error(error);
      }

      return;
    }

    // 自定义接口
    if (option.value.exportType === "customInterface") {
      const { apiUrl, method, headers, body } = option.value.exportConfig;

      body.forEach(({ key, value }: any) => {
        if (key === "") {
          return;
        }

        if (value === "${file}") {
          formData.append(key, file);
        } else {
          formData.append(key, value);
        }
      });

      try {
        const {
          data: {
            result: { signUrl },
          },
        } = await axios({
          headers: headers.map(({ key, value }: any) => ({ [key]: value })),
          url: apiUrl,
          method,
          data: formData,
        });

        handleEncode({ signatureId: options.id, imageUrl: signUrl });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return {
    // 变量
    containerWidth,
    containerHeight,
    initWidth,
    initHeight,
    advanceSignaturePad,
    screenScale,
    container,
    encodeStatus,
    maxWidth,
    resizeObserver,
    defaultOptions,
    // 计算属性
    width,
    height,
    option,
    dataChart,
    componentOptions,
    maxWidthConfig,
    actionControlsConfig,
    configControlsConfig,
    showOperationControls,
    showConfigControls,
    canUndo,
    canRedo,
    renderWidth,
    renderHeight,
    encodes,
    getScaleValueFromContent,
    clearCanvas,
    undoOperation,
    redoOperation,
    processExportedImage,
    onTranslateImage,
    handleEncode,
  };
};
