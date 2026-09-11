<template>
  <div class="lt-result" :class="{ 'is-open': expanded }">
    <div class="lt-result__header" @click="expanded = !expanded">
      <div class="lt-result__header-left">
        <Icon type="iconfont-gongjv" style="font-size: 13px" />
        <span class="lt-result__name">{{ toolName }}</span>
        <span v-if="isPending" class="lt-result__badge pending">执行中...</span>
        <span v-else class="lt-result__badge done">完成</span>
        <slot name="extra" />
      </div>
      <Icon
        :type="expanded ? 'iconfont-shangjiantou' : 'iconfont-xiajiantou'"
        style="font-size: 11px; color: rgba(124, 77, 255, 0.6)"
      />
    </div>

    <transition name="lt-result-expand">
      <div v-if="expanded" class="lt-result__body">
        <div v-if="hasInput" class="lt-result__section">
          <span class="lt-result__label">输入</span>
          <pre class="lt-result__code">{{ formatJson(part.input) }}</pre>
        </div>
        <div v-if="!isPending" class="lt-result__section">
          <span class="lt-result__label">输出</span>
          <pre v-if="isDetail" class="tool-call__code">{{ formatJson(part.output) }}</pre>
          <div v-if="outputList.length" class="lt-result-output">
            <div v-for="(item, index) in outputList" :key="item.id" class="lt-result-text">
              <el-image
                ref="imageRef"
                :src="item.coverUrl"
                show-progress
                @show="imageIndex = index"
                :z-index="9999"
                :initial-index="imageIndex"
                :preview-src-list="srcList"
                fit="cover"
              />
              <span>{{ item.name }}</span>
            </div>
          </div>
          <div v-else class="lt-result-output lt-result-output-tip">{{ part.output }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface LtResultUIPart {
  type: `tool-${string}`;
  toolCallId: string;
  toolName?: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input: unknown;
  output?: any;
}

const props = defineProps<{ part: LtResultUIPart }>();

const expanded = ref(false);
const imageIndex = ref(0);

const toolName = computed(() => props.part.toolName ?? props.part.type.replace(/^tool-/, ""));
const isDetail = computed(() => props.part.toolName && props.part.type.includes("LayoutTemplateDetail"));
const isPending = computed(() => props.part.state !== "output-available");

const hasInput = computed(() => {
  const input = props.part.input;
  return input !== null && input !== undefined && Object.keys(input as object).length > 0;
});

const outputList = computed(() => {
  if (Array.isArray(props.part.output)) {
    return props.part.output;
  }
  return props.part.output && props.part.output.id ? [props.part.output] : [];
});

const srcList = computed(() => {
  if (Array.isArray(props.part.output)) {
    return props.part.output.map((item: any) => item.coverUrl);
  }
  return [];
});

const formatJson = (val: unknown): string => {
  try {
    if (typeof val === "string") {
      // 尝试解析已经是 JSON 字符串的情况
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return val;
      }
    }
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
};
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.lt-result {
  margin: 6px 0;
  border: 1px solid $color-primary-25;
  border-radius: 6px;
  overflow: hidden;
  font-size: 12px;
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: $color-primary-10;
    cursor: pointer;
    user-select: none;
    transition: background $transition-fast;

    &:hover {
      background: $color-primary-18;
    }

    &-left {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 8px;
    }
  }

  &__name {
    white-space: nowrap;
    color: $color-text-dim;
    font-family: $font-monospace;
  }

  &__badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    white-space: nowrap;

    &.pending {
      background: $color-pending-bg;
      color: $color-pending;
    }

    &.done {
      background: $color-primary-20;
      color: $color-primary-done;
    }
  }

  &__body {
    padding: 8px 10px;
    background: $color-bg-tool-body;
    border-top: 1px solid $color-primary-10;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 11px;
    color: $color-text-dim;
    letter-spacing: 0.3px;
  }

  &__code {
    margin: 0;
    padding: 8px 10px;
    background: $color-bg-code;
    border: 1px solid $color-primary-10;
    border-radius: 4px;
    color: $color-code-text;
    font-family: $font-monospace;
    font-size: 11px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: $color-primary-25;
      border-radius: 2px;
    }
  }
}

.lt-result-output {
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 0 4px 4px 0;
  background: $color-bg-code;
  column-count: 4;
  column-gap: 10px;
  &.lt-result-output-tip {
    column-count: unset;
  }
}

.lt-result-text {
  width: fit-content;
  min-width: 60px;
  line-height: 1.2;
  margin-bottom: 10px;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
  break-inside: avoid;
  border: 1px solid #2a2a3e;
  & > img,
  & > .el-image {
    width: 100%;
    height: auto;
  }
  & > span {
    width: 100%;
    margin: 2px 0;
    display: inline-block;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* expand/collapse transition */
.lt-result-expand-enter-active,
.lt-result-expand-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 600px;
  opacity: 1;
}

.lt-result-expand-enter-from,
.lt-result-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
