<template>
  <el-popover
    v-model:visible="visible"
    trigger="click"
    placement="top-start"
    :width="260"
    :show-arrow="false"
    :offset="6"
    popper-class="agent-model-picker"
  >
    <template #reference>
      <button
        type="button"
        class="model-picker-btn"
        :class="{ 'is-active': visible }"
        :title="triggerTitle"
        aria-label="选择模型"
      >
        <img class="model-picker-btn__icon" :src="GROUPS[0].icon" alt="" width="14" height="14" />
        <span class="model-picker-btn__label">{{ triggerLabel }}</span>
        <svg class="model-picker-btn__caret" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2.5 3.75 5 6.25l2.5-2.5" />
        </svg>
      </button>
    </template>

    <div class="agent-model-picker__body">
      <section v-for="group in GROUPS" :key="group.role" class="agent-model-picker__group">
        <h4>
          <img :src="group.icon" alt="" width="14" height="14" />
          <span>{{ group.title }}</span>
        </h4>
        <ul v-if="optionsOf(group.role).length > 0">
          <li v-for="model in optionsOf(group.role)" :key="model.id">
            <button
              type="button"
              class="agent-model-picker__item"
              :class="{ 'is-selected': effectiveModel(group.role)?.id === model.id }"
              @click="selectModel(group.role, model.id)"
            >
              <svg class="agent-model-picker__check" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 6.2 5 8.5l4.5-5" />
              </svg>
              <span class="agent-model-picker__name">{{ aiModelLabel(model) }}</span>
              <span v-if="model.isDefault" class="agent-model-picker__default">默认</span>
            </button>
          </li>
        </ul>
        <p v-else class="agent-model-picker__empty">未配置</p>
      </section>
    </div>

    <footer class="agent-model-picker__foot">
      <span>仅对当前对话生效</span>
      <button type="button" @click="openSettings">
        管理模型
        <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3.75 2.5 6.25 5l-2.5 2.5" /></svg>
      </button>
    </footer>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { aiModelLabel, type ThreadModelRole } from "@/api/aiModel";
import imageIcon from "@/assets/image/models/image.png";
import reasoningIcon from "@/assets/image/models/reasoning.png";
import videoIcon from "@/assets/image/models/video.png";

import { useActiveAgentBISession } from "../agentBISessionContext";

const GROUPS: { role: ThreadModelRole; title: string; icon: string }[] = [
  { role: "reasoning", title: "思考", icon: reasoningIcon },
  { role: "image", title: "生图", icon: imageIcon },
  { role: "video", title: "生视频", icon: videoIcon }
];

const { threadModels } = useActiveAgentBISession();
const { effectiveModel, optionsOf, refreshAiModels, selectModel } = threadModels;

const visible = ref(false);

// 每次打开都刷新：设置页可能刚增删过配置
watch(visible, (open) => {
  if (open) {
    void refreshAiModels();
  }
});

const triggerLabel = computed(() => {
  const reasoning = effectiveModel("reasoning");
  return reasoning ? aiModelLabel(reasoning) : "选择模型";
});

const triggerTitle = computed(() =>
  GROUPS.map(({ role, title }) => {
    const model = effectiveModel(role);
    return `${title}：${model ? aiModelLabel(model) : "未配置"}`;
  }).join("\n")
);

// 新标签页打开：直接跳走会离开编辑器，打断正在进行的对话
const router = useRouter();
const openSettings = () => {
  visible.value = false;
  window.open(router.resolve({ name: "settings" }).href, "_blank");
};
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.model-picker-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 160px;
  height: 26px;
  padding: 0 6px 0 7px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: $color-text-muted;
  font-size: 12px;
  cursor: pointer;
  transition:
    color $transition-fast,
    background-color $transition-fast;

  &:hover,
  &.is-active {
    color: $color-text-primary;
    background-color: rgba(255, 255, 255, 0.06);
  }

  &:focus-visible {
    outline: 2px solid $color-primary-60;
    outline-offset: 1px;
  }

  &__icon {
    flex-shrink: 0;
    object-fit: contain;
  }

  &__label {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__caret {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.7;
  }
}
</style>

<style lang="scss">
@use "../styles/variables" as *;

// popover 被 teleport 到 body，scoped 样式够不着，用 popper-class 命名空间
.el-popover.el-popper.agent-model-picker {
  padding: 4px;
  background: var(--sw-panel-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);

  .agent-model-picker__body {
    max-height: 360px;
    overflow-y: auto;
  }

  .agent-model-picker__group {
    & + & {
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      padding: 6px 8px 4px;
      font-size: 11px;
      font-weight: 500;
      color: $color-text-dim;

      img {
        object-fit: contain;
      }
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
  }

  .agent-model-picker__item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 7px 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: $color-text-secondary;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    &.is-selected {
      color: $color-text-white;

      .agent-model-picker__check {
        visibility: visible;
      }
    }
  }

  .agent-model-picker__check {
    flex-shrink: 0;
    width: 14px;
    height: 12px;
    fill: none;
    stroke: $color-primary;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    visibility: hidden;
  }

  .agent-model-picker__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .agent-model-picker__default {
    flex-shrink: 0;
    font-size: 11px;
    color: $color-text-dim;
  }

  .agent-model-picker__empty {
    margin: 0;
    padding: 4px 8px 6px 28px;
    font-size: 12px;
    color: $color-text-dim;
  }

  .agent-model-picker__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    padding: 8px 8px 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 11px;
    color: $color-text-dim;

    button {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0;
      border: none;
      background: transparent;
      color: $color-text-muted;
      font-size: 12px;
      cursor: pointer;

      &:hover {
        color: $color-text-primary;
      }
    }

    svg {
      width: 10px;
      height: 10px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  }
}
</style>
