<template>
  <div class="ft-nine-patch-global">
    <div class="action-araa">
      <el-form-item label="图片" :label-width="secondLabelWidth">
        <sw-upload
          v-model="selectTargetData[0].option.src"
          :multiple="false"
          :showFileList="false"
          @change="handleUpload"
          @delete="handleUpload"
        />
      </el-form-item>
      <el-form-item label="边界" :label-width="secondLabelWidth">
        <el-button type="primary" @click="handleEdit" style="width: 100%">编辑</el-button>
      </el-form-item>
    </div>
    <el-dialog v-model="isOpen" title="编辑边界" width="60vw" modal-class="sw-dialog" class="custom-dialog">
      <div class="edit-canvas" ref="editCanvasRef">
        <div class="ft-nine-patch" :style="{ ...getBaseStyle, ...getBackgroundStyle }">
          <div class="interface">
            <div class="top-line line" :style="getLineStyle('top')" />
            <div class="right-line line" :style="getLineStyle('right')" />
            <div class="bottom-line line" :style="getLineStyle('bottom')" />
            <div class="left-line line" :style="getLineStyle('left')" />
          </div>
          <slot />
        </div>
      </div>
      <div class="edit-option">
        <StatusSelector label="顶部" :label-width="firstLabelWidth" :properties="['opacity']">
          <FtSlide
            v-model="selectTargetData[0].option.top"
            :min="0"
            :max="100"
            :step="1"
            @change="(value: any) => handleBorderChange(value, 'top')"
          />
        </StatusSelector>
        <StatusSelector label="右边" :label-width="firstLabelWidth" :properties="['opacity']">
          <FtSlide
            v-model="selectTargetData[0].option.right"
            :min="0"
            :max="100"
            :step="1"
            @change="(value: any) => handleBorderChange(value, 'right')"
          />
        </StatusSelector>
        <StatusSelector label="底部" :label-width="firstLabelWidth" :properties="['opacity']">
          <FtSlide
            v-model="selectTargetData[0].option.bottom"
            :min="0"
            :max="100"
            :step="1"
            @change="(value: any) => handleBorderChange(value, 'bottom')"
          />
        </StatusSelector>
        <StatusSelector label="左侧" :label-width="firstLabelWidth" :properties="['opacity']">
          <FtSlide
            v-model="selectTargetData[0].option.left"
            :min="0"
            :max="100"
            :step="1"
            @change="(value: any) => handleBorderChange(value, 'left')"
          />
        </StatusSelector>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { SwSlider as FtSlide } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import { setMinioUrl } from "@screenwright/composables";
import { secondLabelWidth } from "../../constants";

import StatusSelector from "../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const EditFontSize = 13;
const EditBorderWidth = 2;
const isOpen = ref(false);
const contenScale = ref(1);
const contentOffsetX = ref(0);
const contentOffsetY = ref(0);
const imgWidth = ref(0);
const imgHeight = ref(0);

const editCanvasRef = ref();

watch(
  () => selectTargetData.value[0].option.src,
  (newSrc) => {
    setImgInfo(newSrc);
  }
);

// 计算缩放比例
const calcScale = () => {
  if (!editCanvasRef.value) return 1;
  const containerWidth = editCanvasRef.value.clientWidth;
  const containerHeight = editCanvasRef.value.clientHeight;

  const contentWidth = imgWidth.value;
  const contentHeight = imgHeight.value;

  const scaleWidth = containerWidth / contentWidth;
  const scaleHeight = containerHeight / contentHeight;

  const scale = Math.min(scaleWidth, scaleHeight, 1);
  contenScale.value = scale;
};

const handleEdit = () => {
  isOpen.value = true;
  nextTick(() => {
    // 先缩放后再计算偏移
    calcScale();
    getOffset();
  });
};

// 计算缩放后保持居中
const getOffset = () => {
  if (!editCanvasRef.value) return;

  const containerWidth = editCanvasRef.value.clientWidth;
  const containerHeight = editCanvasRef.value.clientHeight;
  const contentWidth = imgWidth.value;
  const contentHeight = imgHeight.value;
  const scale = contenScale.value;

  // 计算居中偏移量（像素值）
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  const offsetX = (containerWidth - scaledWidth) / 2 / scale;
  const offsetY = (containerHeight - scaledHeight) / 2 / scale;

  contentOffsetX.value = offsetX;
  contentOffsetY.value = offsetY;
};

const handleBorderChange = (value: number, direction: "top" | "right" | "bottom" | "left") => {
  const option = selectTargetData.value[0].option;

  // 更新当前方向的值
  option[direction] = value;

  // 根据不同方向调整对应边的值
  switch (direction) {
    case "top":
      if (option.bottom > 100 - value) {
        option.bottom = 100 - value - 1;
      }
      break;
    case "bottom":
      if (option.top > 100 - value) {
        option.top = 100 - value - 1;
      }
      break;
    case "left":
      if (option.right > 100 - value) {
        option.right = 100 - value - 1;
      }
      break;
    case "right":
      if (option.left > 100 - value) {
        option.left = 100 - value - 1;
      }
      break;
  }

  update();
};

const handleUpload = () => {
  selectTargetData.value[0].option.top = 0;
  selectTargetData.value[0].option.right = 0;
  selectTargetData.value[0].option.bottom = 0;
  selectTargetData.value[0].option.left = 0;
  update();
};
const calcPixcel = (percent: number, size: number) => {
  return Math.floor((percent / 100) * size);
};

const getBaseStyle = computed(() => {
  return {
    width: `${imgWidth.value}px`,
    height: `${imgHeight.value}px`,
    transform: `scale(${contenScale.value})  translate(${contentOffsetX.value}px, ${contentOffsetY.value}px)`
  };
});

const getBackgroundStyle = computed(() => {
  const { src } = selectTargetData.value[0].option;
  return {
    "background-image": `url(${setMinioUrl(src)})`,
    "background-size": "100% 100%"
  };
});

const scaledBorderWidth = computed(() => {
  return EditBorderWidth / contenScale.value;
});

const scaledFontSize = computed(() => {
  return EditFontSize / contenScale.value;
});
const getLineStyle = (direction: "top" | "right" | "bottom" | "left") => {
  const style: any = {
    "border-width": `${scaledBorderWidth.value}px`,
    "font-size": `${scaledFontSize.value}px`
  };

  switch (direction) {
    case "top":
      style.top = `${calcPixcel(selectTargetData.value[0].option.top, imgHeight.value)}px`;
      break;
    case "right":
      style.right = `${calcPixcel(selectTargetData.value[0].option.right, imgWidth.value)}px`;
      break;
    case "bottom":
      style.bottom = `${calcPixcel(selectTargetData.value[0].option.bottom, imgHeight.value)}px`;
      break;
    case "left":
      style.left = `${calcPixcel(selectTargetData.value[0].option.left, imgWidth.value)}px`;
      break;
  }

  return style;
};

const setImgInfo = (src: string) => {
  const img = new Image();
  img.src = setMinioUrl(src);
  img.onload = () => {
    imgWidth.value = img.width;
    imgHeight.value = img.height;
  };
  img.onerror = (err: any) => {
    console.log("图片加载失败", err);
  };
};

onMounted(() => {
  setImgInfo(selectTargetData.value[0].option.src);
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.sw-dialog {
  display: flex;
}

:deep(.el-dialog__body) {
  display: flex;
}

.custom-dialog {
  position: relative;
  .edit-canvas {
    position: relative;
    width: 80%;
    height: 60vh;
    min-height: 500px;
    border: 1px solid #505050;
    border-radius: 5px;
    margin: 10px 20px 20px 0;
    overflow: hidden;
  }
  .edit-option {
    flex: 1;
    :deep(.el-form-item) {
      flex-wrap: wrap;
      flex-direction: column;
      border-bottom: 1px solid #505050;
      padding-bottom: 13px;
    }
  }
}

.action-araa {
  margin-top: 10px;
  width: 100%;
  .el-button {
    color: #ffffff;
    width: 90%;
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
  }
}

.ft-nine-patch {
  border-image-repeat: stretch;
  border-image-width: auto;
  border-image-outset: 0;
  box-sizing: border-box;
  position: absolute;
  transform-origin: top left;
  object-fit: contain;
}

.interface {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  position: absolute;
}

.line {
  position: absolute;
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 10px;
    min-height: 10px;
    background-color: rgba($color: #00dd00, $alpha: 0.9);
    color: #505050;
    font-weight: bolder;
    padding: 3px;
    border-radius: 3px;
  }
}

.top-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  border-top: 2px dashed #00ff00;
  &::before {
    content: "顶部";
  }
}

.left-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  border-left: 2px dashed #00ff00;
  &::before {
    content: "左侧";
  }
}

.right-line {
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  border-right: 2px dashed #00ff00;
  &::before {
    content: "右侧";
  }
}

.bottom-line {
  position: absolute;
  bottom: 0;
  height: 1px;
  width: 100%;
  border-bottom: 2px dashed #00ff00;
  &::before {
    content: "底部";
  }
}
</style>
