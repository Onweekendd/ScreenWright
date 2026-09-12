<template>
  <div class="ft-signaturePad" ref="container">
    <canvas id="signature-pad" ref="canvas" :width="renderWidth" :height="renderHeight" />

    <!-- 添加操作控制 (左下角) -->
    <operation-controls
      v-if="showOperationControls"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :show-export="actionControlsConfig.export"
      :show-clear="actionControlsConfig.clear"
      :show-undo="actionControlsConfig.undo"
      :show-redo="actionControlsConfig.redo"
      @export="onExport"
      @clear="clearCanvas"
      @undo="undoOperation"
      @redo="redoOperation"
    />

    <!-- 添加配置控制 (右下角) -->
    <config-controls
      v-if="showConfigControls"
      :pen-color="componentOptions.penColor"
      :min-width="componentOptions.minWidth"
      :max-width="maxWidth"
      :background-color="componentOptions.backgroundColor"
      :show-pen-color="configControlsConfig.penColor"
      :show-background-color="configControlsConfig.backgroundColor"
      :show-line-width="configControlsConfig.lineWidth"
      @update:penColor="updatePenColor"
      @update:minWidth="updateMinWidth"
      @update:maxWidth="updateMaxWidth"
      @update:backgroundColor="updateBackgroundColor"
    />
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";

import { cloneDeep } from "lodash-es";

import { useActionEvent } from "@screenwright/composables";
import { ExhibitEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { AdvanceSignaturePad } from "./AdvanceSignaturePad";
import ConfigControls from "./controls/ConfigControls.vue";
import OperationControls from "./controls/OperationControls.vue";
import { useSignature } from "./useSignature";

const { addEvent } = useActionEvent();
interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const {
  containerWidth,
  containerHeight,
  initWidth,
  initHeight,
  maxWidth,
  screenScale,
  resizeObserver,
  advanceSignaturePad,
  defaultOptions,
  // 计算属性
  width,
  height,
  option,
  dataChart,
  maxWidthConfig,
  componentOptions,
  actionControlsConfig,
  configControlsConfig,
  showOperationControls,
  showConfigControls,
  canUndo,
  canRedo,
  renderWidth,
  renderHeight,
  getScaleValueFromContent,
  clearCanvas,
  undoOperation,
  redoOperation,
  processExportedImage
} = useSignature(props.element);

const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLDivElement | null>(null);

const updatePenColor = (color: string) => {
  defaultOptions.value.penColor = color;
  updatedSignaturePad();
};
const updateMinWidth = (width: number) => {
  defaultOptions.value.minWidth = width;
  updatedSignaturePad();
};
const updateMaxWidth = (width: number) => {
  maxWidth.value = width;
  updatedSignaturePad();
};

const updateBackgroundColor = (color: string) => {
  defaultOptions.value.backgroundColor = color;
  updatedSignaturePad();
};

const updateScale = () => {
  if (container.value === null) return;
  screenScale.value = getScaleValueFromContent(document.getElementsByClassName("view-wrapper")[0] as HTMLDivElement);
  updatedSignaturePad();
};

const updatedSignaturePad = () => {
  if (advanceSignaturePad.value) {
    advanceSignaturePad.value.updateSignaturePadOptions(componentOptions.value);
  } else {
    if (canvas.value === null) return;

    advanceSignaturePad.value = new AdvanceSignaturePad(
      canvas.value as HTMLCanvasElement,
      componentOptions.value,
      () => {
        canUndo.value = advanceSignaturePad.value ? advanceSignaturePad.value.canUndo() : false;
        canRedo.value = advanceSignaturePad.value ? advanceSignaturePad.value.canRedo() : false;
      }
    );
  }
};

const onExport = () => {
  if (!advanceSignaturePad.value) return;

  try {
    // 尝试直接获取dataUrl
    const dataUrl = advanceSignaturePad.value.toDataURL();
    processExportedImage(dataUrl);
  } catch (error) {
    console.error("Error exporting canvas:", error);

    // 如果有跨域图片，使用替代方案
    if (
      error instanceof Error &&
      error.name === "SecurityError" &&
      advanceSignaturePad.value &&
      advanceSignaturePad.value.currentImageProperties
    ) {
      console.info("Canvas is tainted due to cross-origin image. Creating new canvas for export.");

      // 创建一个新的临时canvas
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      if (!canvas.value) return;

      tempCanvas.width = canvas.value.width;
      tempCanvas.height = canvas.value.height;

      if (tempCtx) {
        // 绘制背景
        tempCtx.fillStyle = componentOptions.value.backgroundColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 获取当前绘制的点
        const drawingData = advanceSignaturePad.value.toData();

        // 如果有签名数据，使用SVG导出
        if (drawingData.length > 0 && advanceSignaturePad.value.signaturePad) {
          // 使用SVG方法导出签名
          const svgString = advanceSignaturePad.value.signaturePad.toSVG({
            includeBackgroundColor: true
          });

          if (svgString) {
            // 将SVG转换为图片并绘制到临时canvas
            const img = new Image();
            img.onload = () => {
              tempCtx.drawImage(img, 0, 0);
              const exportDataUrl = tempCanvas.toDataURL("image/png");
              processExportedImage(exportDataUrl);
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgString);
          } else {
            // 无法获取SVG，降级为仅使用当前点数据
            const exportDataUrl = tempCanvas.toDataURL("image/png");
            processExportedImage(exportDataUrl);
          }
        } else {
          // 没有签名数据，直接使用临时canvas
          const exportDataUrl = tempCanvas.toDataURL("image/png");
          processExportedImage(exportDataUrl);
        }
      }
    }
  }
};

const initCanvas = async () => {
  await nextTick();
  if (container.value === null) return;
  containerWidth.value = container.value.clientWidth;
  containerHeight.value = container.value.clientHeight;
  screenScale.value = getScaleValueFromContent(document.getElementsByClassName("view-wrapper")[0] as HTMLDivElement);
  await nextTick();
  if (canvas.value && container.value) {
    updatedSignaturePad();
  }
};

watch(
  () => option.value,
  (newVal) => {
    defaultOptions.value = { ...cloneDeep(newVal), scale: screenScale.value };
    updatedSignaturePad();
  },
  { deep: true }
);

watch(
  () => dataChart.value,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      maxWidth.value = newVal[0].penWidth;

      updatedSignaturePad();
    }
  },
  { deep: true, immediate: true }
);

onMounted(async () => {
  await nextTick();
  initWidth.value = width.value;
  initHeight.value = height.value;
  defaultOptions.value = { ...cloneDeep(option.value), scale: screenScale.value };
  maxWidth.value = maxWidthConfig.value;

  await initCanvas();
  useEventListener(window, "resize", updateScale);
  resizeObserver.value = new ResizeObserver(async () => {
    if (container.value) {
      containerWidth.value = container.value.clientWidth;
      containerHeight.value = container.value.clientHeight;
      await nextTick();
      updatedSignaturePad();
    }
  });

  if (container.value) {
    resizeObserver.value.observe(container.value as Element);
  }
  addEvent({
    [`${ExhibitEnum.FtSignaturePad}-${props.element.id}`]: {
      onExport: onExport,
      onClear: clearCanvas,
      onRedo: redoOperation,
      onUndo: undoOperation,
      onTranslateImage: () => {}
    }
  });
});

onBeforeUnmount(() => {
  if (advanceSignaturePad.value) {
    advanceSignaturePad.value = null;
  }

  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
  }
});
</script>
<style lang="scss" scoped>
// 变量定义
$border-color: #e70;
.ft-signaturePad {
  width: 100%;
  height: 100%;
}

.signature-pad-container {
  width: 100%;
  height: 100%;
  position: relative;

  /* 默认不设置容器查询，作为降级方案 */
  @supports (container-type: inline-size) {
    container-type: inline-size;
    container-name: signature-container;
  }

}
</style>
