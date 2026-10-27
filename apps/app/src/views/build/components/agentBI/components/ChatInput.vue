<template>
  <div class="box-footer">
    <div v-if="attachments.length > 0" class="attachment-strip">
      <div v-for="item in attachments" :key="item.id" class="attachment-thumb">
        <MediaAttachmentPreview
          :media="{ filename: item.filename, mediaType: item.mediaType, url: item.previewUrl || item.remoteUrl || '' }"
          :preview-media="previewMedia"
        />
        <div v-if="item.status === 'uploading'" class="thumb-overlay thumb-uploading" />
        <div v-if="item.status === 'error'" class="thumb-overlay thumb-error">!</div>
        <button
          type="button"
          class="thumb-remove"
          :aria-label="`移除：${item.filename}`"
          @click.stop="removeAttachment(item.id)"
        >
          ×
        </button>
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
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*,video/*,.mkv,.m4v,.avi,.mov,.wmv,.flv,.mpg,.mpeg,.ts"
      multiple
      style="display: none"
      @change="handleFileChange"
    />

    <div class="footer-input">
      <!-- contenteditable 编辑区，替代 el-input textarea -->
      <div
        ref="editorRef"
        class="editor"
        contenteditable="true"
        data-placeholder="请输入您的问题，可粘贴图片，输入 @ 引用组件..."
        @input="handleInput"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
        @click="handleEditorClick"
        @paste="handlePaste"
      />

      <div class="footer-actions">
        <div class="context-wrapper">
          <el-tooltip :content="contextTooltip" placement="top" :show-arrow="true" popper-class="context-tooltip">
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
          <div class="context-btn-split" />

          <el-dropdown
            trigger="click"
            placement="top-start"
            popper-class="agent-select-dropdown agent-attachment-dropdown"
            @command="handleAttachmentCommand"
            @visible-change="attachmentMenuVisible = $event"
          >
            <button
              type="button"
              class="upload-image-btn"
              :class="{ 'is-active': attachmentMenuVisible }"
              aria-label="添加图片或视频"
              title="添加图片或视频"
            >
              <Icon type="iconfont-exportPic" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="assets">从素材库选择</el-dropdown-item>
                <el-dropdown-item command="local">本地上传</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
import { computed, onMounted, ref } from "vue";

import { AgentMode } from "@screenwright/server/rpc";
import type { ComponentType } from "@screenwright/types";
import { ElMessage } from "element-plus";

import Icon from "@/components/Icon/index.vue";
import { useDialog } from "@/hooks/useDialog";
import { setMinioUrl } from "@/utils/config";
import type { MenuItemForRender } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import SelectAssets from "@/views/build/components/buildTabs/selectAssets/index.vue";

import { useActiveAgentBISession } from "../agentBISessionContext";
import { getAttachmentMediaType } from "../hooks/attachmentMedia";
import MediaAttachmentPreview from "./MediaAttachmentPreview.vue";
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
  addMedia,
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
const attachmentMenuVisible = ref(false);
const previewMedia = computed(() =>
  attachments.value.map((item) => ({
    filename: item.filename,
    mediaType: item.mediaType,
    url: item.previewUrl || item.remoteUrl || ""
  }))
);

const openFilePicker = () => fileInputRef.value?.click();

const { dialog } = useDialog();
const openAssetPicker = () => {
  dialog({
    DialogProps: { title: "选择图片或视频素材", width: "980px", modalClass: "build-render-ignore" },
    component: SelectAssets,
    componentProps: {},
    closeBefore: (componentData, done) => {
      const asset = componentData.validate() as MenuItemForRender | null;
      if (!asset) {
        return;
      }
      const url = setMinioUrl(asset.url || asset.img);
      const urlExtension = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
      const extension = getAttachmentMediaType(url) ? urlExtension : (asset.fileType?.toLowerCase() ?? "");
      const mediaType = getAttachmentMediaType(`asset.${extension}`);
      if (!url || !mediaType) {
        ElMessage.warning("请选择图片或视频素材");
        return;
      }
      const name = asset.name || asset.title || "素材";
      addMedia({
        filename: getAttachmentMediaType(name) ? name : `${name}.${extension}`,
        mediaType,
        url: new URL(url, window.location.href).href
      });
      done();
    }
  });
};

const handleAttachmentCommand = (command: string) => {
  if (command === "assets") {
    openAssetPicker();
  } else if (command === "local") {
    openFilePicker();
  }
};

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

const props = defineProps<{ modelValue: string }>();
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

// Restore the shared draft when moving between the canvas and sidebar composers.
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.textContent = props.modelValue;
  }
});
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
      width: 64px;
      height: 64px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;

      .thumb-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;

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

      &:focus-within .thumb-remove {
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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      padding: 2px;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      color: $color-primary;
      font-size: 20px;
      border-radius: 5px;
      transition:
        color $transition-fast,
        background-color $transition-fast,
        border-color $transition-fast;

      &:hover,
      &.is-active {
        color: $color-text-primary;
        background-color: $color-primary-18;
        border-color: $color-primary-40;
      }

      &:focus-visible {
        outline: 2px solid $color-primary-60;
        outline-offset: 2px;
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
