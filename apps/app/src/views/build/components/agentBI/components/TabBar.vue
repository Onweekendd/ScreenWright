<template>
  <div class="tab-bar">
    <!-- 横向可滚动的 tab 条 -->
    <div class="tab-list">
      <div
        v-for="session in sessions"
        :key="session.sessionId"
        class="tab-item"
        :class="{ 'is-active': session.sessionId === activeSessionId }"
        @click="$emit('select', session.sessionId)"
      >
        <!-- 待审批（需用户操作）优先显示闪烁黄灯；否则才显示流式中的紫灯，两者不同时出现 -->
        <span v-if="hasPending(session)" class="tab-badge" />
        <span v-else-if="session.isStreaming.value" class="tab-dot" />

        <!-- 标题展示态：逐字符飘入动画 + 生成中转圈（命名能力已迁至历史侧栏，tab 不再内联编辑） -->
        <span :key="session.currentThreadTitle.value" class="tab-title">
          <span
            v-for="(char, index) in chars(session)"
            :key="index"
            class="tab-title-char"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            {{ char }}
          </span>
        </span>
        <el-icon v-if="session.isGeneratingTitle.value" class="tab-title-loading"><Loading /></el-icon>

        <!-- 单 tab 关闭按钮（仅多于一个 tab 时显示，hover 可见） -->
        <Icon
          v-if="sessions.length > 1"
          type="iconfont-guanbi1"
          style="font-size: 12px"
          class="tab-close"
          @click.stop="$emit('close', session.sessionId)"
        />
      </div>
    </div>

    <!-- 固定在最右端的整体操作（不参与横向滚动） -->
    <div class="tab-actions">
      <el-tooltip v-if="activeHasMessages" effect="dark" placement="bottom" content="清空聊天记录">
        <Icon type="iconfont-shanchu1" style="font-size: 15px" class="action-icon" @click="$emit('clear-records')" />
      </el-tooltip>
      <el-tooltip effect="dark" placement="left" content="关闭">
        <Icon type="iconfont-guanbi1" style="font-size: 18px" class="action-icon" @click="$emit('close-drawer')" />
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { Loading } from "@element-plus/icons-vue";

import Icon from "@/components/Icon/index.vue";

import { useConfirm } from "../hooks/useConfirm";
import type { AgentBISession } from "../useAgentBI";

const props = defineProps<{
  sessions: AgentBISession[];
  activeSessionId: string;
}>();

defineEmits<{
  select: [sessionId: string];
  close: [sessionId: string];
  "clear-records": [];
  "close-drawer": [];
}>();

const { dialogs } = useConfirm();

/** 该 tab 是否有待审批弹窗（用于角标） */
const hasPending = (session: AgentBISession) => dialogs.value.has(session.sessionId);

/** 标题逐字符拆分，用于飘入动画 */
const chars = (session: AgentBISession) => session.currentThreadTitle.value.split("");

/** 当前激活 tab 是否已有消息（决定是否显示「清空聊天记录」） */
const activeHasMessages = computed(() => {
  const active = props.sessions.find((s) => s.sessionId === props.activeSessionId);
  return !!active && active.messages.value.length > 0;
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.tab-bar {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  height: 34px;
  gap: 6px;
  padding: 0 4px;
  /* 与下方内容区之间的分隔线：选中 tab 通过弧形把自身底色铺到这条线上，形成无缝衔接 */
  border-bottom: 1px solid $color-primary-20;
}

/* ---- tab 条（可横向滚动） ---- */
.tab-list {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;

  &::-webkit-scrollbar {
    height: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-primary-20;
    border-radius: 2px;
  }
}

$tab-curve: 8px;
/* 选中/hover 时铺到下方的底色，与 panel-inner 顶部一致，使 tab 像从内容区"长"出来 */
$tab-active-bg: $color-primary-10;

.tab-item {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 180px;
  height: 28px;
  padding: 0 10px;
  border-radius: $tab-curve $tab-curve 0 0;
  color: $color-text-secondary;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color $transition-fast,
    background $transition-fast;

  /* 左右两侧的弧形过渡（与 AskUserQuestionPart 同款）：
     ::before 在左侧产生 / 曲线，::after 在右侧产生 \ 曲线，使 tab 底边平滑融入下方内容 */
  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    width: $tab-curve;
    height: $tab-curve;
    pointer-events: none;
  }

  &::before {
    left: -$tab-curve;
    background: radial-gradient(circle at 0% 0%, transparent $tab-curve, transparent $tab-curve);
  }

  &::after {
    right: -$tab-curve;
    background: radial-gradient(circle at 100% 0%, transparent $tab-curve, transparent $tab-curve);
  }

  &:hover {
    color: $color-text-primary;
    background: $color-primary-10;

    &::before {
      background: radial-gradient(circle at 0% 0%, transparent $tab-curve, $color-primary-10 $tab-curve);
    }

    &::after {
      background: radial-gradient(circle at 100% 0%, transparent $tab-curve, $color-primary-10 $tab-curve);
    }

    /* hover 才展开关闭图标，平时宽度为 0 不占空间 */
    .tab-close {
      width: 13px;
      margin-left: 2px;
      opacity: 1;
    }
  }

  &.is-active {
    color: $color-text-primary;
    background: $tab-active-bg;
    font-weight: 500;
    z-index: 1;

    &::before {
      background: radial-gradient(circle at 0% 0%, transparent $tab-curve, $tab-active-bg $tab-curve);
    }

    &::after {
      background: radial-gradient(circle at 100% 0%, transparent $tab-curve, $tab-active-bg $tab-curve);
    }
  }
}

.tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: $color-primary;
  animation: tab-dot-breath 1.6s ease-in-out infinite;
}

.tab-badge {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: $color-pending;
  animation: tab-badge-blink 1s steps(1, end) infinite;
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

.tab-title-char {
  display: inline-block;
  white-space: pre;
  animation: tab-char-fade 0.3s ease both;
}

.tab-title-loading {
  flex-shrink: 0;
  font-size: 13px;
  color: $color-text-secondary;
  animation: tab-title-spin 1s linear infinite;
}

.tab-close {
  flex-shrink: 0;
  cursor: pointer;
  color: $color-text-secondary;
  /* 平时折叠为 0 宽度、不占布局，仅 tab hover 时展开 */
  width: 0;
  margin-left: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    width $transition-fast,
    margin $transition-fast,
    opacity $transition-fast,
    color $transition-fast;

  &:hover {
    color: $color-text-primary;
  }
}

/* ---- 右端整体操作 ---- */
.tab-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.action-icon {
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  margin-right: 2px;
  color: $color-text-secondary;
  transition: color $transition-fast;

  &:hover {
    color: $color-text-primary;
  }
}

@keyframes tab-char-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tab-title-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes tab-dot-breath {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

/* 待审批黄灯：硬切闪烁，区别于流式紫灯的呼吸 */
@keyframes tab-badge-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.2;
  }
}
</style>
