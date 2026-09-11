<template>
  <!-- 审批/提问/计划弹层：提升到 process-area 级别，浮于对话页/后台任务页底部，不遮罩、不阻断其余交互 -->
  <Transition name="ask-popup">
    <div v-if="pendingDialog" class="ask-popup-layer">
      <div
        class="ask-popup-panel"
        :class="{
          'ask-popup-panel--plan': pendingDialog.type === 'submit_plan',
          'ask-popup-panel--tall':
            pendingDialog.type === 'save_ai_template' || pendingDialog.type === 'apply_ai_template'
        }"
      >
        <AskUserQuestionPart
          v-if="pendingDialog.type === 'question'"
          :questions="pendingDialog.questions"
          @submit="(answers) => resolveQuestion(sessionId, answers)"
          @close="closeDialog(sessionId)"
        />
        <ConfirmPart
          v-else-if="pendingDialog.type === 'confirm'"
          :message="pendingDialog.message"
          @accept="resolveConfirm(sessionId, true)"
          @reject="resolveConfirm(sessionId, false)"
          @close="closeDialog(sessionId)"
        />
        <SubmitPlanDialog
          v-else-if="pendingDialog.type === 'submit_plan'"
          :summary="pendingDialog.summary"
          :plan="pendingDialog.plan"
          @select="(result) => resolveSubmitPlan(sessionId, result)"
          @close="closeDialog(sessionId)"
        />
        <AiTemplateSaveForm
          v-else-if="pendingDialog.type === 'save_ai_template'"
          :preset-values="pendingDialog.preset"
          @confirm="(payload) => resolveSaveAiTemplate(sessionId, { saved: true, templateId: payload.templateId })"
          @cancel="resolveSaveAiTemplate(sessionId, { saved: false, canceled: true })"
        />
        <AiTemplateApplyCards
          v-else-if="pendingDialog.type === 'apply_ai_template'"
          :template-ids="pendingDialog.templateIds"
          @apply="(payload) => resolveApplyAiTemplate(sessionId, { applied: true, ...payload })"
          @cancel="resolveApplyAiTemplate(sessionId, { applied: false, canceled: true })"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";

import AiTemplateSaveForm from "../../buildTabs/aiTemplateSaveForm.vue";
import { useActiveAgentBISession } from "../agentBISessionContext";
import { useConfirm } from "../hooks/useConfirm";
import AiTemplateApplyCards from "./AiTemplateApplyCards.vue";
import AskUserQuestionPart from "./AskUserQuestionPart.vue";
import ConfirmPart from "./ConfirmPart.vue";
import SubmitPlanDialog from "./SubmitPlanDialog.vue";

const {
  dialogs,
  resolveConfirm,
  resolveQuestion,
  resolveSubmitPlan,
  resolveSaveAiTemplate,
  resolveApplyAiTemplate,
  closeDialog
} = useConfirm();

// 只展示「当前激活 tab」对应 sessionId 的审批；其余 tab 的审批排队，切到该 tab 时才弹出
const { sessionId } = useActiveAgentBISession();
const pendingDialog = computed(() => dialogs.value.get(sessionId));
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

/* 定位容器：贴底浮层。不设背景、不拦截指针，让弹窗之外的区域保持正常交互 */
.ask-popup-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  pointer-events: none;
}

.ask-popup-panel {
  width: 100%;
  padding: 12px;
  max-height: 60vh;
  overflow-y: auto;
  /* 仅面板本身可交互 */
  pointer-events: auto;

  &--plan {
    max-height: 85vh;
    overflow-y: visible;
  }

  /* AI 模板内容偏长（嵌入摘要 + 范式 JSON 编辑器），给足高度并允许内部滚动 */
  &--tall {
    max-height: 88vh;
  }
}

/* AI 模板表单复用自 buildTabs，原本依赖外层 Dialog 提供底色；
   浮层里没有 Dialog 容器，这里对齐计划审批弹窗（SubmitPlanDialog）的卡片风格：
   同底色 + 紫色描边 + 圆角，使其与其余浮层一致；仅在该浮层场景生效，不影响手动入口。 */
:deep(.ai-template-save .save-content) {
  background-color: $color-bg-dropdown;
  border: 1px solid $color-primary-50;
  border-radius: 10px;
}

.ask-popup-enter-active,
.ask-popup-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.ask-popup-enter-from,
.ask-popup-leave-to {
  transform: translateY(16px);
  opacity: 0;
}
</style>
