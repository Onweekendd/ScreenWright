<template>
  <div class="operation-controls">
    <el-button-group>
      <el-button
        :class="['custom-button']"
        v-if="showExport"
        :icon="Download"
        size="small"
        @click="emit('export')"
        title="导出"
      >
        <span class="button-text">导出</span>
      </el-button>

      <el-button
        :class="['custom-button']"
        v-if="showClear"
        :icon="DeleteFilled"
        size="small"
        @click="emit('clear')"
        title="清除"
      >
        <span class="button-text">清除</span>
      </el-button>
      <el-button
        :class="['custom-button']"
        v-if="showUndo"
        :icon="ArrowLeftBold"
        size="small"
        @click="emit('undo')"
        title="撤销"
        :disabled="!canUndo"
      >
        <span class="button-text">撤销</span>
      </el-button>
      <el-button
        :class="['custom-button']"
        v-if="showRedo"
        :icon="ArrowRightBold"
        size="small"
        @click="emit('redo')"
        title="重做"
        :disabled="!canRedo"
      >
        <span class="button-text">重做</span>
      </el-button>
    </el-button-group>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftBold, ArrowRightBold, DeleteFilled, Download } from "@element-plus/icons-vue";

interface Props {
  canUndo?: boolean;
  canRedo?: boolean;
  showExport?: boolean;
  showClear?: boolean;
  showUndo?: boolean;
  showRedo?: boolean;
}

const _props = withDefaults(defineProps<Props>(), {
  canUndo: false,
  canRedo: false,
  showExport: true,
  showClear: true,
  showUndo: true,
  showRedo: true
});

const emit = defineEmits<{
  (e: "export"): void;
  (e: "clear"): void;
  (e: "undo"): void;
  (e: "redo"): void;
}>();
</script>

<style lang="scss" scoped>
.operation-controls {
  position: absolute;
  left: 15px;
  bottom: 15px;
  z-index: 10;
  transition: all 0.3s ease;

  /* 容器查询 - 现代浏览器 */
  @container signature-container (width <= 1919px) and (width > 1199px) {
    left: 10px;
    bottom: 10px;
  }

  @container signature-container (width <= 1199px) {
    left: 8px;
    bottom: 8px;
  }

  /* 媒体查询 - 降级方案 */
  @supports not (container-type: inline-size) {
    @media (max-width: 1919px) {
      left: 10px;
      bottom: 10px;
    }

    @media (max-width: 1199px) {
      left: 8px;
      bottom: 8px;
    }
  }

  .el-button-group {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    border-radius: 4px;

    .custom-button {
      background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      color: white;
      padding: 8px 15px;
      transition: all 0.3s ease;

      /* 容器查询 - 现代浏览器 */
      @container signature-container (width <= 1919px) and (width > 1199px) {
        padding: 6px 12px;
      }

      @container signature-container (width <= 1199px) {
        padding: 4px 8px;

        .button-text {
          display: none;
        }

        i {
          margin-right: 0;
        }
      }

      /* 媒体查询 - 降级方案 */
      @supports not (container-type: inline-size) {
        @media (max-width: 1919px) {
          padding: 6px 12px;
        }

        @media (max-width: 1199px) {
          padding: 4px 8px;

          .button-text {
            display: none;
          }

          i {
            margin-right: 0;
          }
        }
      }

      &:hover,
      &:focus {
        background: linear-gradient(180deg, #9a6ff0 0%, #7440ff 100%);
        color: white;
      }

      &:active {
        background: linear-gradient(180deg, #7440ff 0%, #5a20ff 100%);
        border-color: #5a20ff;
        color: white;
      }

      &[disabled] {
        background: transparent;
        color: white;
      }

      & + .custom-button {
        margin-left: -1px;
      }

      i {
        margin-right: 4px;

        /* 容器查询 - 现代浏览器 */
        @container signature-container (width <= 1919px) {
          margin-right: 3px;
        }

        /* 媒体查询 - 降级方案 */
        @supports not (container-type: inline-size) {
          @media (max-width: 1919px) {
            margin-right: 3px;
          }
        }
      }
    }
  }
}
</style>
