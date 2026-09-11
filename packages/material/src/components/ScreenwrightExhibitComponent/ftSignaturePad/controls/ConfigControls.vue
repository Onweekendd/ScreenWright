<template>
  <div class="config-controls">
    <div class="config-item">
      <div class="config-item-box" v-if="showPenColor">
        <span class="label">画笔颜色</span>
        <el-color-picker
          class="colorPicker"
          size="small"
          :show-alpha="true"
          v-model="penColorValue"
          @change="updatePenColor"
        />
      </div>

      <div class="config-item-box" v-if="showBackgroundColor">
        <span class="label">背景颜色</span>

        <el-color-picker
          class="colorPicker"
          size="small"
          :show-alpha="true"
          v-model="backgroundColorValue"
          @change="updateBackgroundColor"
        />
      </div>
    </div>

    <div class="config-item" v-if="showLineWidth">
      <span class="label">线条宽度</span>
      <div class="slider-container">
        <sw-slider
          v-model="lineWidthValue"
          :min="1"
          :max="20"
          :format-tooltip="(val) => `${val}px`"
          @change="updateLineWidth"
          :showNumberInput="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { SwSlider } from "@screenwright/ui";

interface Props {
  penColor: string;
  minWidth: number;
  maxWidth: number;
  backgroundColor: string;
  showPenColor: boolean;
  showBackgroundColor: boolean;
  showLineWidth: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:penColor": [color: string];
  "update:maxWidth": [width: number];
  "update:backgroundColor": [color: string];
}>();

const penColorValue = ref(props.penColor);
const lineWidthValue = ref(props.maxWidth);
const backgroundColorValue = ref(props.backgroundColor);

// 监听props变化
watch(
  () => props.penColor,
  (val) => {
    penColorValue.value = val;
  }
);

watch(
  () => props.maxWidth,
  (val) => {
    lineWidthValue.value = val;
  }
);

watch(
  () => props.backgroundColor,
  (val) => {
    backgroundColorValue.value = val;
  }
);

// 更新方法
const updatePenColor = (color: any) => {
  emit("update:penColor", color);
};

const updateLineWidth = (width: any) => {
  emit("update:maxWidth", width);
};

const updateBackgroundColor = (color: any) => {
  emit("update:backgroundColor", color);
};
</script>

<style lang="scss" scoped>
:deep(.el-card__body) {
  padding: 5px !important;

  /* 容器查询 - 现代浏览器 */
  @container signature-container (width <= 1919px) and (width > 1199px) {
    padding: 3px !important;
  }

  @container signature-container (width <= 1199px) {
    padding: 2px !important;
  }

  /* 媒体查询 - 降级方案 */
  @supports not (container-type: inline-size) {
    @media (max-width: 1919px) {
      padding: 3px !important;
    }

    @media (max-width: 1199px) {
      padding: 2px !important;
    }
  }
}

:deep(.el-color-picker__trigger) {
  width: 24px;
  height: 24px;
  border: none !important;
  padding: 0 !important;

  /* 容器查询 - 现代浏览器 */
  @container signature-container (width <= 1919px) and (width > 1199px) {
    width: 28px;
    height: 28px;
  }

  @container signature-container (width <= 1199px) {
    width: 24px;
    height: 24px;
  }

  /* 媒体查询 - 降级方案 */
  @supports not (container-type: inline-size) {
    @media (max-width: 1919px) {
      width: 28px;
      height: 28px;
    }

    @media (max-width: 1199px) {
      width: 24px;
      height: 24px;
    }
  }
}

:deep(.el-slider__runway) {
  margin-top: 0px !important;
}

.config-controls {
  position: absolute;
  right: 15px;
  bottom: 15px;
  z-index: 10;
  width: 250px;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  padding: 6px;

  /* 容器查询 - 现代浏览器 */
  @container signature-container (width <= 1919px) and (width > 1199px) {
    width: 200px;
    right: 10px;
    bottom: 10px;
  }

  @container signature-container (width <= 1199px) {
    width: 160px;
    right: 8px;
    bottom: 8px;
  }

  /* 媒体查询 - 降级方案 */
  @supports not (container-type: inline-size) {
    @media (max-width: 1919px) {
      width: 200px;
      right: 10px;
      bottom: 10px;
    }

    @media (max-width: 1199px) {
      width: 180px;
      right: 8px;
      bottom: 8px;
    }
  }

  :deep(.el-card) {
    padding: 5px;

    /* 容器查询 - 现代浏览器 */
    @container signature-container (width <= 1919px) and (width > 1199px) {
      padding: 3px;
    }

    @container signature-container (width <= 1199px) {
      padding: 2px;
    }

    /* 媒体查询 - 降级方案 */
    @supports not (container-type: inline-size) {
      @media (max-width: 1919px) {
        padding: 3px;
      }

      @media (max-width: 1199px) {
        padding: 2px;
      }
    }
  }

  .config-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 8px;

    /* 容器查询 - 现代浏览器 */
    @container signature-container (width <= 1919px) and (width > 1199px) {
      margin-bottom: 8px;
      gap: 6px;
    }

    @container signature-container (width <= 1199px) {
      margin-bottom: 6px;
      gap: 4px;
    }

    /* 媒体查询 - 降级方案 */
    @supports not (container-type: inline-size) {
      @media (max-width: 1919px) {
        margin-bottom: 8px;
      }

      @media (max-width: 1199px) {
        margin-bottom: 6px;
      }
    }

    .config-item-box {
      display: flex;
      align-items: center;
      flex: 1;
    }

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      width: 65px;
      font-size: 14px;
      color: white;

      /* 容器查询 - 现代浏览器 */
      @container signature-container (width <= 1919px) and (width > 1199px) {
        width: 55px;
        font-size: 13px;
      }

      @container signature-container (width <= 1199px) {
        width: 45px;
        font-size: 10px;
      }

      /* 媒体查询 - 降级方案 */
      @supports not (container-type: inline-size) {
        @media (max-width: 1919px) {
          width: 65px;
          font-size: 13px;
        }

        @media (max-width: 1199px) {
          width: 55px;
          font-size: 12px;
        }
      }
    }

    .slider-container {
      flex: 1;
      margin-right: 10px;

      /* 容器查询 - 现代浏览器 */
      @container signature-container (width <= 1919px) and (width > 1199px) {
        margin-right: 8px;
      }

      @container signature-container (width <= 1199px) {
        margin-right: 6px;
      }

      /* 媒体查询 - 降级方案 */
      @supports not (container-type: inline-size) {
        @media (max-width: 1919px) {
          margin-right: 8px;
        }

        @media (max-width: 1199px) {
          margin-right: 6px;
        }
      }
    }
  }
}
</style>
