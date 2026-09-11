<template>
  <div
    class="property-value-editor"
    :class="{ 'drag-completed': isDragCompleted }"
    :style="{ width: `${propertyValueEditorWidth}px` }"
    @mousedown.capture="onClick"
  >
    <!-- 数字类型编辑器 -->
    <transition name="editor-fade" mode="out-in" appear>
      <div class="editor-container number-editor" v-if="isNumberType" :key="'number'">
        <el-input-number
          :model-value="localValue"
          :precision="precision"
          :step="step"
          :min="min"
          :max="max"
          size="small"
          controls-position="right"
          @change="onChange"
          class="number-input"
        />
        <div class="editor-indicator number-indicator" />
      </div>

      <!-- 布尔类型编辑器 -->
      <div class="editor-container boolean-editor" v-else-if="isBooleanType" :key="'boolean'">
        <el-switch
          class="ft-switch boolean-switch"
          v-model="localValue"
          size="small"
          @change="onChange"
          :active-color="'#8b58e7'"
          :inactive-color="'rgba(255, 255, 255, 0.2)'"
        />
        <div class="editor-indicator boolean-indicator" />
      </div>

      <!-- 图片类型编辑器 -->
      <div class="editor-container image-editor" v-else-if="isImageType" :key="'image'">
        <div class="image-preview-container" @click="openImagePreviewHandler">
          <div class="image-wrapper">
            <img class="image-preview" :src="setMinioUrl(localValue)" alt="" />
            <div class="image-overlay">
              <Icon name="编辑图片" type="iconfont-bianji" size="16" />
            </div>
          </div>
          <div class="image-actions">
            <span class="action-text">点击编辑</span>
          </div>
        </div>
        <div class="editor-indicator image-indicator" />
      </div>

      <div class="editor-container image-editor" v-else-if="isVideoType" :key="'video'">
        <div class="image-preview-container">
          <div class="image-wrapper">
            <sw-upload
              :model-value="localValue"
              :fileType="FileType.video"
              :showDel="false"
              :multiple="false"
              :showFileList="false"
              @change="onVideoChange"
            />
          </div>
          <div class="image-actions">
            <span class="action-text">点击编辑</span>
          </div>
        </div>
        <div class="editor-indicator image-indicator" />
      </div>

      <!-- 文本类型编辑器 -->
      <div class="editor-container text-editor" v-else :key="'text'">
        <el-input :value="localValue" size="small" @change="onChange" class="text-input" placeholder="输入文本" />
        <div class="editor-indicator text-indicator" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useImagePreviewDialog } from "@screenwright/material/exhibit";

import { FileType } from "@/components/SwUpload/SwUpload";
import SwUpload from "@/components/SwUpload/index.vue";
import Icon from "@/components/Icon/index.vue";
import { setMinioUrl } from "@/utils/config";

import type { ComponentAnimationConfig, PropertyNode } from "../type";
import { useStatusAnimation } from "../useStatusAnimation";
import { PROPERTY_VALUE_EDITOR_WIDTH } from "../utils/constants";

// 定义组件名称
defineOptions({
  name: "PropertyValueEditor"
});

// Props
interface Props {
  value: any;
  property: PropertyNode;
  statusId: string;
  componentId: string;
}
const props = defineProps<Props>();

// 使用 hooks
const { setSelectedRowId, updatePropertyValue, dragCompleteSignal } = useStatusAnimation();

// 响应式数据
const propertyValueEditorWidth = ref(PROPERTY_VALUE_EDITOR_WIDTH);
const localValue = ref(props.value);
const isDragCompleted = ref(false);

const { openImagePreview } = useImagePreviewDialog();

const openImagePreviewHandler = async () => {
  const next = await openImagePreview([
    {
      src: localValue.value,
      title: "图片"
    }
  ]);
  // 检查返回值是否有效，防止图片被清空
  if (next && next.length > 0 && next[0].src && localValue.value !== next[0].src) {
    localValue.value = next[0].src;
    onChange(localValue.value);
  }
};

// 数字类型属性配置
const numberTypeProperties: Record<
  keyof Omit<ComponentAnimationConfig, "display" | "componentId" | "image" | "video">,
  { precision: number; step: number; min?: number; max?: number }
> = {
  // 旋转类属性，精度为2，步长为0.1，范围[-360, 360]
  rotateX: { precision: 2, step: 0.1, min: -360, max: 360 },
  rotateY: { precision: 2, step: 0.1, min: -360, max: 360 },
  rotateZ: { precision: 2, step: 0.1, min: -360, max: 360 },
  // 位置类属性，精度为0，步长为1，允许负值
  left: { precision: 0, step: 1 },
  top: { precision: 0, step: 1 },
  // 尺寸类属性，精度为0，步长为1，最小值为0
  width: { precision: 0, step: 1, min: 0 },
  height: { precision: 0, step: 1, min: 0 },
  // 透明度，精度为2，步长为0.01，范围[0, 1]
  opacity: { precision: 2, step: 0.01, min: 0, max: 1 },
  // 层级，精度为0，步长为1，最小值为0
  zIndex: { precision: 0, step: 1, min: 0 },
  // 字体大小，精度为0，步长为1，最小值为0
  fontSize: { precision: 0, step: 1, min: 0 }
};

// 布尔类型属性
const booleanProperties = ["display"];

// 计算属性
const propertyName = computed(() => props.property.property);

// 是否为数字类型
const isNumberType = computed(() => {
  return (
    (propertyName.value &&
      Object.prototype.hasOwnProperty.call(
        numberTypeProperties,
        propertyName.value as keyof typeof numberTypeProperties
      )) ||
    typeof props.value === "number"
  );
});

const isVideoType = computed(() => {
  return propertyName.value === "video" && typeof props.value === "string";
});

// 是否为布尔类型
const isBooleanType = computed(() => {
  return (propertyName.value && booleanProperties.includes(propertyName.value)) || typeof props.value === "boolean";
});

// 是否为图片类型
const isImageType = computed(() => {
  return propertyName.value === "image" && typeof props.value === "string";
});

// 数字精度
const precision = computed(() => {
  if (propertyName.value === "image") {
    return 0;
  }

  if (
    isNumberType.value &&
    propertyName.value &&
    numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties]
  ) {
    return numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties].precision;
  }
  return 0;
});

// 数字步长
const step = computed(() => {
  if (propertyName.value === "image") {
    return 1;
  }

  if (
    isNumberType.value &&
    propertyName.value &&
    numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties]
  ) {
    return numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties].step;
  }
  return 1;
});

// 数字最小值
const min = computed(() => {
  if (
    isNumberType.value &&
    propertyName.value &&
    numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties]
  ) {
    return numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties].min;
  }
  return undefined;
});

// 数字最大值
const max = computed(() => {
  if (
    isNumberType.value &&
    propertyName.value &&
    numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties]
  ) {
    return numberTypeProperties[propertyName.value as keyof typeof numberTypeProperties].max;
  }
  return undefined;
});

// 监听外部值变化
watch(
  () => props.value,
  (newVal) => {
    localValue.value = newVal;
  },
  { immediate: true }
);

// 监听拖拽完成信号
watch(dragCompleteSignal, (newVal) => {
  if (newVal > 0) {
    triggerDragCompleteAnimation();
  }
});

// const onBlur = async (value: any) => {
//   console.log("onBlur", value)
//   await onChange(localValue.value)
// }

const onChange = async (val: any) => {
  let validatedValue = val === undefined || val === null ? 0 : val;

  // 对数字类型进行范围验证
  if (isNumberType.value && typeof validatedValue === "number") {
    const minValue = min.value;
    const maxValue = max.value;

    if (minValue !== undefined && validatedValue < minValue) {
      validatedValue = minValue;
      localValue.value = minValue; // 同步更新本地值
    }
    if (maxValue !== undefined && validatedValue > maxValue) {
      validatedValue = maxValue;
      localValue.value = maxValue; // 同步更新本地值
    }
  }

  localValue.value = validatedValue;

  try {
    await updatePropertyValue({
      componentId: props.componentId,
      statusId: props.statusId,
      property: propertyName.value as keyof ComponentAnimationConfig,
      value: validatedValue
    });
  } catch (error) {
    console.error("更新属性值失败:", error);
  }
};

const onVideoChange = (val: any) => {
  // 检查视频URL是否有效，防止视频被清空
  if (val && val.url) {
    onChange(val.url);
  }
};

const onClick = () => {
  setSelectedRowId(props.property.id);
};

// 触发拖拽完成动画
const triggerDragCompleteAnimation = () => {
  isDragCompleted.value = true;
  setTimeout(() => {
    isDragCompleted.value = false;
  }, 600); // 动画持续时间
};

// 暴露方法给父组件调用
defineExpose({
  triggerDragCompleteAnimation
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@import "../styles/variables";
@include common-element-style(".el-select__wrapper");
@include common-element-style(".el-input__wrapper");

.property-value-editor {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 6px;
  position: relative;

  .editor-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(46, 49, 63, 0.2);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &:hover {
      border-color: var(--focus-border);

      .editor-indicator {
        opacity: 1;
        transform: scaleX(1);
      }
    }

    &:focus-within {
      border-color: var(--focus-border);
      .editor-indicator {
        opacity: 1;
        transform: scaleX(1);
      }
    }

    .editor-indicator {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      opacity: 0;
      transform: scaleX(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
    }

    // 数字编辑器
    &.number-editor {
      .number-indicator {
        background: var(--primary-light);
      }

      .number-input {
        width: 100%;

        :deep(.el-input-number__decrease),
        :deep(.el-input-number__increase) {
          width: 26px !important;
          background: rgba(139, 88, 231, 0.1);
          border: 1px solid rgba(139, 88, 231, 0.3) !important;
          color: var(--text-primary);
          transition: all 0.3s ease;
          &:hover {
            background: var(--primary-light);
            border-color: rgba(139, 88, 231, 0.8) !important;
            transform: scale(1.05);
          }
        }

        :deep(.el-input__wrapper) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding-left: 8px !important;
          padding-right: 30px !important;

          .el-input__inner {
            color: var(--text-primary) !important;
            font-weight: 500;
            font-size: 12px;
            text-align: center;
          }
        }
      }
    }

    // 布尔编辑器
    &.boolean-editor {
      .boolean-indicator {
        background: var(--primary-gradient);
      }

      .boolean-switch {
        :deep(.el-switch__core) {
          border: 2px solid rgba(139, 88, 231, 0.3);
          background-color: rgba(255, 255, 255, 0.1) !important;
          transition: all 0.3s ease;

          &::after {
            transition: all 0.3s ease;
          }
        }

        :deep(.el-switch__core.is-checked) {
          border-color: #8b58e7;
          background: var(--primary-gradient) !important;
        }
      }
    }

    // 图片编辑器
    &.image-editor {
      padding: 6px;
      .image-indicator {
        background: var(--primary-pale);
      }

      .image-preview-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        cursor: pointer;
        position: relative;

        .image-wrapper {
          flex: 1;
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);

          .image-preview {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .image-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            color: white;
          }

          &:hover {
            .image-preview {
              transform: scale(1.05);
            }

            .image-overlay {
              opacity: 1;
            }
          }
        }

        .image-actions {
          margin-top: 4px;
          text-align: center;

          .action-text {
            font-size: 10px;
            color: var(--text-secondary);
            transition: color 0.3s ease;
          }
        }

        &:hover .action-text {
          color: var(--text-primary);
        }
      }
    }

    // 文本编辑器
    &.text-editor {
      .text-indicator {
        background: var(--primary-dark);
      }

      .text-input {
        width: 100%;

        :deep(.el-input__wrapper) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 8px !important;

          .el-input__inner {
            color: var(--text-primary) !important;
            font-size: 12px;
            text-align: center;

            &::placeholder {
              color: var(--text-secondary);
              font-size: 11px;
            }
          }
        }
      }
    }
  }
}

.boolean-editor {
  animation: booleanEditorPulse 3s ease-in-out infinite;
}

.image-editor {
  animation: imageEditorFloat 4s ease-in-out infinite;
}

.text-editor {
  animation: textEditorShimmer 5s ease-in-out infinite;
}

@keyframes booleanEditorPulse {
  0%,
  100% {
    border-color: rgba(139, 88, 231, 0.1);
  }
  50% {
    border-color: rgba(139, 88, 231, 0.3);
  }
}

@keyframes imageEditorFloat {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-1px);
  }
}

@keyframes textEditorShimmer {
  0%,
  100% {
    border-color: rgba(139, 88, 231, 0.1);
  }
  50% {
    border-color: rgba(139, 88, 231, 0.3);
  }
}

// 编辑器过渡动画
.editor-fade-enter-active,
.editor-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.editor-fade-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
  filter: blur(2px);
}

.editor-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  filter: blur(2px);
}

.editor-fade-enter-to,
.editor-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

// 拖拽后的特殊动画效果
.property-value-editor {
  &.drag-completed {
    .editor-container {
      animation: dragCompletePulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}

@keyframes dragCompletePulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(139, 88, 231, 0.7);
    border-color: var(--border-color);
  }
  25% {
    transform: scale(1.05);
    box-shadow: 0 0 0 4px rgba(139, 88, 231, 0.4);
    border-color: rgba(139, 88, 231, 0.8);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 8px rgba(139, 88, 231, 0.2);
    border-color: rgba(139, 88, 231, 1);
  }
  75% {
    transform: scale(1.02);
    box-shadow: 0 0 0 4px rgba(139, 88, 231, 0.1);
    border-color: rgba(139, 88, 231, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(139, 88, 231, 0);
    border-color: var(--border-color);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .property-value-editor {
    padding: 2px 4px;

    .editor-container {
      &.image-editor {
        padding: 4px;
      }
    }
  }
}
</style>
