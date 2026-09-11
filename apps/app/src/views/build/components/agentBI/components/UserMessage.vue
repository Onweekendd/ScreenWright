<template>
  <div class="user-msg">
    <div class="bubble">
      <div v-if="imageFiles.length > 0 || selectedComponentNames.length > 0" class="attachment-grid">
        <el-image
          v-for="(file, idx) in imageFiles"
          :key="file.url"
          :src="file.url"
          :preview-src-list="imageUrls"
          :initial-index="idx"
          fit="cover"
          class="attachment-thumb"
          preview-teleported
        />
        <span v-for="(name, idx) in selectedComponentNames" :key="`${name}-${idx}`" class="component-tag">{{
          name
        }}</span>
      </div>
      <template v-for="(seg, i) in segments" :key="i">
        <ComponentRefChip v-if="seg.type === 'ref'" :name-path="seg.value" />
        <span v-else class="text-seg">{{ seg.value }}</span>
      </template>
    </div>
    <el-select
      v-if="canUndo"
      popper-class="agent-select-dropdown"
      :model-value="undefined"
      :fit-input-width="false"
      class="undo-select"
      placement="bottom-end"
      placeholder=""
      title="撤销"
      @change="onUndoSelect"
    >
      <template #prefix>
        <Icon :size="13" type="iconfont-fanhuichexiao" />
      </template>
      <el-option label="撤销到此处" value="undo" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { UIMessage } from "ai";

import Icon from "@/components/Icon/index.vue";

import ComponentRefChip from "./ComponentRefChip.vue";

type MessagePart = UIMessage["parts"][number];
type FilePart = Extract<MessagePart, { type: "file" }>;

const props = defineProps<{ parts: UIMessage["parts"]; canUndo?: boolean }>();
const emit = defineEmits<{ undo: [] }>();

// 点图标不直接撤销，而是展开 el-select 下拉，选中「撤销到此处」才触发
const onUndoSelect = (val: string) => {
  if (val === "undo") {
    emit("undo");
  }
};

// 用户消息发送时会把 <editor-context> 与 <user-message> 拼成一段 text，这里只展示
// <user-message> 内的纯文本；缺失标签时降级为原 text，避免历史结构差异导致空气泡
// 欢迎页示例点击发出的消息会再包一层 <welcome>，展示时同样提炼出标签内的纯文本
const textContent = computed(() =>
  (props.parts ?? [])
    .filter((p): p is Extract<MessagePart, { type: "text" }> => p.type === "text")
    .map((p) => {
      const match = p.text.match(/<user-message>([\s\S]*?)<\/user-message>/);
      const inner = match ? match[1].trim() : p.text;
      const welcomeMatch = inner.match(/<welcome>([\s\S]*?)<\/welcome>/);
      return welcomeMatch ? welcomeMatch[1].trim() : inner;
    })
    .join("")
);

const imageFiles = computed<FilePart[]>(() =>
  (props.parts ?? []).filter(
    (p): p is FilePart =>
      p.type === "file" &&
      typeof (p as FilePart).mediaType === "string" &&
      (p as FilePart).mediaType.startsWith("image/")
  )
);

const imageUrls = computed(() => imageFiles.value.map((f) => f.url));

// 发送时拼入 <selected-components> 的画布选中组件，只取 name 展示在附件区
const selectedComponentNames = computed(() => {
  const fullText = (props.parts ?? [])
    .filter((p): p is Extract<MessagePart, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  const block = fullText.match(/<selected-components>([\s\S]*?)<\/selected-components>/);
  if (!block || block[1].trim() === "无") {
    return [];
  }

  const names: string[] = [];
  const componentRegex = /<component\s[^>]*name="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = componentRegex.exec(block[1])) !== null) {
    names.push(match[1]);
  }
  return names;
});

const segments = computed(() => {
  const result: { type: "text" | "ref"; value: string }[] = [];
  const regex = /<component-rf>(.*?)<\/component-rf>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(textContent.value)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: "text", value: textContent.value.slice(lastIndex, match.index) });
    }
    const namePath = match[1].split("|")[0];
    result.push({ type: "ref", value: namePath });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < textContent.value.length) {
    result.push({ type: "text", value: textContent.value.slice(lastIndex) });
  }

  return result;
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.user-msg {
  position: relative;
  display: flex;
  justify-content: flex-end;
  margin: 8px 0 16px 0;
}

// 撤销下拉：只露出一个居中图标触发器（无背景），展开后弹「撤销到此处」选项
.undo-select {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  transform: translate(50%, -50%);
  opacity: 0;
  transition: opacity 0.15s;

  :deep(.el-select__wrapper) {
    width: 20px;
    height: 20px;
    min-height: 20px;
    padding: 0;
    justify-content: center;
    background: transparent;
    border-radius: 50%;
    box-shadow: 0 0 0 1px $color-primary-40;
    cursor: pointer;
  }

  // 只保留居中的前缀图标，隐藏选择区、占位文字与下拉箭头
  :deep(.el-select__selection),
  :deep(.el-select__placeholder),
  :deep(.el-select__suffix) {
    display: none;
  }

  :deep(.el-select__prefix) {
    margin: 0;
    color: $color-primary-60;
  }

  // hover 用主色加亮（而非变白）
  &:hover :deep(.el-select__wrapper) {
    box-shadow: 0 0 0 1px $color-primary;
  }

  &:hover :deep(.el-select__prefix) {
    color: $color-primary;
  }
}

.user-msg:hover .undo-select {
  opacity: 1;
}

.bubble {
  max-width: 78%;
  padding: 4px 12px 8px 12px;
  background: $gradient-user-bubble;
  border: 1px solid $color-primary-40;
  border-radius: 12px 2px 12px 12px;
  color: $color-text-user-bubble;
  font-size: 13px;
  line-height: 1.6;
  letter-spacing: 0.5px;
  white-space: pre-line;
  word-break: break-word;
}

.text-seg {
  white-space: pre-line;
}

.attachment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;

  .attachment-thumb {
    width: 64px;
    height: 64px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid $color-lp-25;
    cursor: zoom-in;
  }

  .component-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 6px;
    border-radius: 4px;
    background: $color-lp-20;
    border: 1px solid $color-lp-40;
    color: $color-text-white;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
}
</style>
