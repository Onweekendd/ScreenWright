<template>
  <div class="ask-question-part">
    <!-- 顶部标签栏 -->
    <div class="tab-bar">
      <button
        v-for="(q, i) in questions"
        :key="q.question"
        :class="['tab-item', { active: activeIndex === i }]"
        @click="activeIndex = i"
      >
        {{ q.header }}
        <span v-if="activeIndex !== i && !!getAnswer(q)" class="answered-dot" />
      </button>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <!-- 当前问题内容 -->
    <div v-if="activeQ" class="question-block">
      <div class="question-text">{{ activeQ.question }}</div>

      <div class="options-list">
        <button
          v-for="opt in activeQ.options"
          :key="opt.label"
          :class="['option-btn', { active: isSelected(activeQ.question, opt.label) }]"
          @click="toggleOption(activeQ, opt)"
        >
          <span class="opt-label">{{ opt.label }}</span>
          <span class="opt-desc">{{ opt.description }}</span>
        </button>
      </div>

      <div class="answer-input-row">
        <input v-model="localAnswers[activeQ.question]" class="answer-input" placeholder="或在此直接输入自定义内容" />
      </div>
    </div>

    <div class="submit-row">
      <button class="submit-btn" :disabled="!canSubmit" @click="handleSubmit">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import type { AskUserQuestion, QuestionOption } from "@screenwright/server/rpc";

const props = defineProps<{ questions: AskUserQuestion[] }>();

const emit = defineEmits<{
  submit: [answers: Record<string, string>];
  close: [];
}>();

const activeIndex = ref(0);
const activeQ = computed(() => props.questions[activeIndex.value]);

const selectedOptions = reactive<Record<string, Set<string>>>({});
const localAnswers = reactive<Record<string, string>>({});

props.questions.forEach((q) => {
  selectedOptions[q.question] = new Set();
  localAnswers[q.question] = "";
});

function isSelected(questionText: string, optLabel: string): boolean {
  return selectedOptions[questionText]?.has(optLabel) ?? false;
}

function toggleOption(q: AskUserQuestion, opt: QuestionOption): void {
  const set = selectedOptions[q.question];
  if (!q.multiSelect) {
    if (set.has(opt.label)) {
      set.clear();
    } else {
      set.clear();
      set.add(opt.label);
    }
  } else {
    if (set.has(opt.label)) {
      set.delete(opt.label);
    } else {
      set.add(opt.label);
    }
  }
}

function getAnswer(q: AskUserQuestion): string {
  const inputVal = localAnswers[q.question].trim();
  if (inputVal) {
    return inputVal;
  }
  const set = selectedOptions[q.question];
  return [...set].join(", ");
}

const canSubmit = computed(() => props.questions.every((q) => getAnswer(q)));

function handleSubmit(): void {
  const answers: Record<string, string> = {};
  props.questions.forEach((q) => {
    answers[q.question] = getAnswer(q);
  });
  emit("submit", answers);
}
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.ask-question-part {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  margin: 8px 0;
  background: $color-bg-dropdown;
  border: 1px solid $color-primary-50;
  border-radius: 10px;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 8px 0;
  border-bottom: 1px solid $color-primary-20;
}

$tab-curve: 10px;

.tab-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: $color-text-dim;
  background: transparent;
  border: none;
  border-radius: $tab-curve $tab-curve 0 0;
  cursor: pointer;
  transition:
    color $transition-fast,
    background $transition-fast;

  // ::before 在 tab 左侧：圆心放左上角(0% 0%)，透明区在左上，着色区在右下 → 产生 / 曲线
  // ::after  在 tab 右侧：圆心放右上角(100% 0%)，透明区在右上，着色区在左下 → 产生 \ 曲线
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
  }

  &.active {
    color: $color-primary-name;
    background: $color-primary-18;
    z-index: 1;

    &::before {
      background: radial-gradient(circle at 0% 0%, transparent $tab-curve, $color-primary-18 $tab-curve);
    }

    &::after {
      background: radial-gradient(circle at 100% 0%, transparent $tab-curve, $color-primary-18 $tab-curve);
    }
  }
}

.answered-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: $color-primary;
  flex-shrink: 0;
}

.close-btn {
  margin-left: auto;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: $color-text-dim;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition:
    color $transition-fast,
    background $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-primary-18;
  }
}

.question-block {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.question-tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: $color-primary-name;
  background: $color-primary-18;
  border: 1px solid $color-primary-25;
  border-radius: 4px;
  padding: 1px 6px;
  letter-spacing: 0.3px;
}

.question-text {
  font-size: 13px;
  color: $color-text-msg;
  line-height: 1.5;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $color-primary-20;
  border-radius: 7px;
  cursor: pointer;
  text-align: left;
  transition:
    background $transition-fast,
    border-color $transition-fast;

  &:hover {
    background: $color-primary-10;
    border-color: $color-primary-35;
  }

  &.active {
    background: $color-primary-18;
    border-color: $color-primary-50;
  }
}

.opt-label {
  font-size: 13px;
  font-weight: 500;
  color: $color-text-primary;
}

.opt-desc {
  font-size: 11px;
  color: $color-text-muted;
  line-height: 1.4;
}

.answer-input-row {
  margin-top: 2px;
}

.answer-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid $color-input-border;
  border-radius: 6px;
  color: $color-text-primary;
  font-size: 13px;
  outline: none;
  transition: border-color $transition-fast;

  &::placeholder {
    color: $color-text-dim;
  }

  &:focus {
    border-color: $color-input-border-focus;
  }
}

.submit-row {
  display: flex;
  justify-content: flex-end;
  padding: 0 16px 14px;
}

.submit-btn {
  padding: 7px 20px;
  background: $color-primary;
  border: none;
  border-radius: 6px;
  color: $color-text-white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity $transition-fast;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}
</style>
