<template>
  <div class="box-footer">
    <div v-if="attachments.length > 0" class="attachment-strip">
      <div v-for="item in attachments" :key="item.id" class="attachment-thumb">
        <img :src="item.previewUrl" class="thumb-img" />
        <div v-if="item.status === 'uploading'" class="thumb-overlay thumb-uploading" />
        <div v-if="item.status === 'error'" class="thumb-overlay thumb-error">!</div>
        <button class="thumb-remove" @mousedown.prevent="removeAttachment(item.id)">×</button>
      </div>
    </div>

    <ul
      v-if="mention.active && filteredComponents.length > 0"
      ref="dropdownRef"
      class="mention-dropdown"
      :style="dropdownStyle"
    >
      <li
        v-for="(item, idx) in filteredComponents"
        :key="item.component.id"
        class="mention-item"
        :class="{ active: idx === mention.activeIndex }"
        @mousedown.prevent="selectMention(item.component, item.rfContent)"
      >
        <span class="mention-item-name">{{ item.displayPath }}</span>
        <span class="mention-item-id">#{{ item.component.id }}</span>
      </li>
    </ul>
    <input ref="fileInputRef" type="file" accept="image/*" multiple style="display: none" @change="handleFileChange" />

    <div class="footer-input">
      <!-- contenteditable 编辑区，替代 el-input textarea -->
      <div
        ref="editorRef"
        class="editor"
        contenteditable="true"
        data-placeholder="请输入您的问题，输入 @ 引用组件..."
        @input="handleInput"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
        @click="handleEditorClick"
        @paste="handlePaste"
      />

      <div class="footer-actions">
        <div class="context-wrapper">
          <el-tooltip
            v-if="contextPercentage > 50"
            :content="contextTooltip"
            placement="top"
            :show-arrow="true"
            popper-class="context-tooltip"
          >
            <div class="context-btn-wrapper" @click="handleCompact">
              <el-progress
                type="circle"
                :width="20"
                :stroke-width="3"
                :percentage="contextPercentage"
                :color="contextColor"
                class="context-btn"
                :show-text="false"
              />
            </div>
          </el-tooltip>
          <div v-if="contextPercentage > 50" class="context-btn-split" />

          <el-tooltip content="上传图片" placement="top" :show-arrow="true" popper-class="context-tooltip">
            <Icon type="iconfont-exportPic" class="upload-image-btn" @click="openFilePicker" />
          </el-tooltip>
        </div>

        <div class="send-group">
          <el-select
            popper-class="agent-select-dropdown"
            :model-value="currentMode"
            class="mode-select"
            size="small"
            @change="updateThreadMode"
          >
            <el-option v-for="(label, key) in MODE_LABELS" :key="key" :label="label" :value="key" />
          </el-select>

          <Icon
            :type="isStreaming ? 'iconfont-tingzhi' : 'iconfont-xiangshangjiantou'"
            class="footer-send-btn"
            :class="{ 'is-streaming': isStreaming }"
            @click="isStreaming ? stopStreaming() : handleSend()"
          />
        </div>
      </div>
    </div>

    <SelectedComponentsList :components="selectTargetData" @tag-click="handleTagClick" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { AgentMode } from "@screenwright/server/rpc";
import type { ComponentType } from "@screenwright/types";
import { ElMessage } from "element-plus";

import Icon from "@/components/Icon/index.vue";

import { useActiveAgentBISession } from "../agentBISessionContext";
import SelectedComponentsList from "./SelectedComponentsList.vue";
import { useChatInput } from "./useChatInput";

const MODE_LABELS: Record<AgentMode, string> = {
  [AgentMode.ASK_BEFORE_EDIT]: "修改前询问",
  [AgentMode.AUTO_EDIT]: "自动修改",
  [AgentMode.PLAN]: "计划模式"
};

const {
  activeThreadId,
  addFiles,
  attachments,
  compacting,
  contextColor,
  contextPercentage,
  contextTooltip,
  currentMode,
  isStreaming,
  removeAttachment,
  requestCompact,
  resourceId,
  stopStreaming,
  updateThreadMode
} = useActiveAgentBISession();

const fileInputRef = ref<HTMLInputElement>();

const openFilePicker = () => fileInputRef.value?.click();

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    addFiles(input.files);
    input.value = "";
  }
};

const handleCompact = async () => {
  const threadId = activeThreadId.value;
  const rid = resourceId.value;
  if (compacting.value || !threadId || !rid) {
    return;
  }
  try {
    const { messageCountBefore, messageCountAfter } = await requestCompact({ resourceId: rid, threadId });

    ElMessage.success(`压缩上下文成功，从 ${messageCountBefore} 条消息压缩到 ${messageCountAfter} 条消息。`);
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "压缩上下文失败");
  }
};

defineProps<{ modelValue: string }>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [];
  "mention-click": [component: ComponentType];
}>();

const {
  dropdownRef,
  dropdownStyle,
  editorRef,
  filteredComponents,
  handleEditorClick,
  handleInput,
  handleKeydown,
  handleKeyup,
  handlePaste,
  handleSend,
  handleTagClick,
  mention,
  selectMention,
  selectTargetData
} = useChatInput(emit);
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;
@import "src/style/mixins/element.scss";

.box-footer {
  flex-shrink: 0;
  position: relative;
  padding: 10px 20px;
  min-height: 140px;
  display: flex;
  flex-direction: column;

  .mention-dropdown {
    position: absolute;
    z-index: 9999;
    margin: 0;
    padding: 4px 0;
    list-style: none;
    background: $color-bg-dropdown;
    border: 1px solid $color-lp-50;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    max-height: 200px;
    overflow-y: auto;
    transform: translateY(-100%);
    width: 100%;

    .mention-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      cursor: pointer;
      transition: background $transition-fast;
      gap: 8px;

      &:hover,
      &.active {
        background: $color-lp-20;
      }

      .mention-item-name {
        color: $color-text-white;
        font-size: 13px;
        font-weight: 500;
      }

      .mention-item-id {
        color: rgba(255, 255, 255, 0.4);
        font-size: 11px;
        font-family: $font-monospace;
        flex-shrink: 0;
      }
    }
  }

  .attachment-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 0 2px;

    .attachment-thumb {
      position: relative;
      width: 56px;
      height: 56px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid $color-lp-25;

      .thumb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .thumb-overlay {
        position: absolute;
        inset: 0;

        &.thumb-uploading {
          background: rgba(0, 0, 0, 0.45);
          animation: thumb-pulse 1s ease-in-out infinite alternate;
        }

        &.thumb-error {
          background: rgba(245, 108, 108, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: bold;
          font-size: 16px;
        }
      }

      .thumb-remove {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0;

        &:hover {
          background: rgba(245, 108, 108, 0.85);
        }
      }

      &:hover .thumb-remove {
        display: flex;
      }
    }
  }

  @keyframes thumb-pulse {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }

  .footer-input {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid $color-input-border;
    background: $color-bg-editor;
    transition: border-color $transition-fast;

    &:focus-within {
      border-color: $color-input-border-focus;
    }

    .editor {
      width: 100%;
      min-height: 60px;
      max-height: 200px;
      overflow-y: auto;
      border-radius: 6px;
      background: $color-primary-5;
      color: $color-text-primary;
      font-size: 13px;
      font-family:
        Source Han Sans CN-Regular,
        Source Han Sans CN;
      line-height: 1.6;
      padding: 4px 6px;
      outline: none;
      word-break: break-word;
      white-space: pre-wrap;

      &:empty::before {
        content: attr(data-placeholder);
        color: $color-text-dim;
        pointer-events: none;
      }

      /* mention chip 样式 */
      :deep(.mention-chip) {
        display: inline-block;
        padding: 2px 8px;
        margin: 0 2px;
        border-radius: 4px;
        background: $color-lp-35;
        border: 1px solid $color-lp-70;
        color: $color-text-white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        user-select: none;
        transition:
          background $transition-fast,
          border-color $transition-fast;
        vertical-align: baseline;

        &:hover {
          background: $color-lp-55;
          border-color: $color-lp-95;
          color: #fff;
          box-shadow: 0 0 8px $color-lp-40;
        }
      }
    }

    .footer-actions {
      height: 30px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .context-wrapper {
        display: flex;
        align-items: center;
        height: 100%;
        flex: 1;
        gap: 6px;

        .context-btn-split {
          width: 0;
          height: 14px;
          border-left: 1px solid rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
        }
      }
    }

    .send-group {
      display: flex;
      align-items: center;
      gap: 4px;

      .mode-select {
        width: 100px;
        --el-border-color: #{$color-lp-25};
        --el-border-color-hover: #{$color-lp-50};
        --el-fill-color-blank: transparent;
        --el-text-color-regular: #{$color-text-muted};
        --el-component-size-small: 24px;
        --el-font-size-base: 12px;
        --el-input-focus-border-color: #{$color-lp-50};

        :deep(.el-input__wrapper) {
          box-shadow: 0 0 0 1px var(--el-border-color) inset;
          background: transparent;
          padding: 0 4px 0 8px;
          transition: box-shadow $transition-fast;

          &:hover {
            box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
          }

          &.is-focus {
            box-shadow: 0 0 0 1px $color-lp-50 inset !important;
          }
        }

        :deep(.el-select__wrapper.is-focused) {
          box-shadow: 0 0 0 1px $color-lp-50 inset !important;
        }

        :deep(.el-input__inner) {
          font-size: 12px;
          color: $color-text-muted;
        }

        :deep(.el-input__suffix-inner .el-icon) {
          color: $color-text-dim;
          font-size: 11px;
        }
      }
    }

    .footer-send-btn {
      cursor: pointer;
      color: $color-primary;
      border-radius: 5px;
      transition: color $transition-fast;

      &:hover {
        color: $color-primary-dark;
      }

      &.is-streaming {
        color: #f56c6c;

        &:hover {
          color: #ff4d4f;
        }
      }
    }

    .upload-image-btn {
      cursor: pointer;
      color: $color-primary;
      font-size: 20px;
      border-radius: 5px;
      transition: color $transition-fast;

      &:hover {
        color: $color-primary-dark;
      }
    }

    .context-btn {
      --el-fill-color-light: rgba(255, 255, 255, 0.15);
      cursor: pointer;
      flex-shrink: 0;
      color: $color-primary;
      transition: color $transition-fast;

      &:hover {
        color: $color-primary-dark;
      }

      &.is-streaming {
        color: #f56c6c;

        &:hover {
          color: #ff4d4f;
        }
      }
    }
  }
}
</style>
