import { AgentMode, type ResumeData, type SuspendPayload, SuspendType } from "@screenwright/server/rpc";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import type { PanelState } from "../../../buildRender/core/SystemComponent/type";
import { UpdateHistoryTypeEnum, useAction } from "../../../buildRender/hooks/useAction";
import { createLocalPanelStatus } from "../../../buildRender/hooks/useCommonPanelAction";
import { useEditStore } from "../../../buildRender/hooks/useEditStore";
import { createCanvasOpsHandler, getBatchOperationFields } from "../canvas/canvasOps";
import { enqueueCanvasMutation } from "../canvas/useCanvasMutationQueue";
import type { ComponentPlacement } from "../canvas/useCreateComponent";
import { useCreateComponent } from "../canvas/useCreateComponent";
import { captureAndUploadCanvas } from "../capture/captureAndUploadCanvas";
import { useConfirm } from "../ui/useConfirm";
import type { SuspendedToolInfo } from "./useAgentBIStream";

/**
 * Suspend handler 函数类型。
 * @typeParam T - suspend type 枚举值，自动推导 payload 和 resumeData 两侧类型
 */
export type SuspendHandlerFn<T extends SuspendType = SuspendType> = (
  info: SuspendedToolInfo<SuspendPayload<T>>
) => Promise<ResumeData<T> | null>;

/**
 * 处理流中的 data-component-update 副作用。
 * 内部维护计数器，按位置切片取新增项（msg.parts 是累积快照，支持同一组件多次更新）。
 * @param sessionId - 所属会话 id；审批弹窗（confirm/askQuestion/...）按 sessionId 排队，实现按 tab 隔离
 * @param deps.applyLocalMode - 切换前端 AgentMode 本地状态
 *
 * 注：所有「真正修改画布」的写入（创建/删除组件、保存/删除过滤器、推送组件更新、更新大屏配置）
 * 都通过 enqueueCanvasMutation 串行化——画布只有一份，多 tab 并发写入需排队，避免互相破坏。
 * 但 confirm(...) 等待用户审批的部分不入队，否则一个 tab 等审批会卡住其他 tab 的画布写入。
 */
export function useComponentStreamUpdater(
  sessionId: string,
  { applyLocalMode }: { applyLocalMode: (mode: AgentMode) => void }
) {
  const editor = useScreenEditor();
  const { allComponentMap } = useGlobalComponentData();
  const { createComponent, createComponentFromConfig, onDeleteComponent, moveComponents } = useCreateComponent();
  const { handleSaveFilter, deleteFilter } = useDataFilter();
  const { handleSelectGroupAction, handleGroupDelete, updateComponentLayers } = useAction();
  const { isPanel, editConfig } = useEditStore();
  const { confirm, showSubmitPlan, askQuestion, showSaveAiTemplate, showApplyAiTemplate } = useConfirm();

  const { emitFilterTrigger } = useCallbackArguments();

  /**
   * 将后端推送的组件增量合并到前端已有的组件实例上，并触发图层更新和关联关系同步。
   * 检测 cbArgs / openFilter / listenArgs 变化，分别同步回调关系和过滤触发器。
   * @param rawComponent - 前端已有的原始组件实例（会被就地 merge）
   * @param parsed - 后端推送的已校验组件数据
   * @param placement - 组件放置信息（动态面板等场景使用）
   */
  const applyComponentUpdate = async (
    rawComponent: ComponentType,
    parsed: ComponentType,
    placement?: ComponentPlacement
  ) => {
    const update = editor.component.applyUpdate(parsed, { strategy: "merge" });
    if (!update) {
      throw new Error(`组件 ${parsed.id} 不存在`);
    }

    const status = placement?.parentType === "dynamicPanel" ? true : isPanel();
    // syncWorkspace: false —— 工作区已由后端过 core 之后写好（见 servers/server 的 applyComponentEdit）。
    // 前端这一侧再全量回写一遍，等于用自己的状态覆盖后端刚算出来的派生值。
    await updateComponentLayers(rawComponent, {
      fullUpdateDynamicPanel: false,
      fullUpdateGroup: false,
      status,
      syncWorkspace: false
    });

    if (update.parentGroup) {
      await updateComponentLayers(update.parentGroup, {
        fullUpdateGroup: false,
        syncWorkspace: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }

    if (update.openFilterChanged || update.listenArgsChanged) {
      await emitFilterTrigger(`${rawComponent.id}`);
    }
  };

  // ── Suspend handlers，按 suspendPayload.type 注册 ────────────────────────────

  /**
   * 纯审批：弹确认框，后端根据 approved 自行处理后续（edit_files、createEventTemplate）。
   * @field purpose - 审批目的说明
   */
  const handleAskApproval: SuspendHandlerFn<SuspendType.AskApproval> = async (info) => {
    const { purpose } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否允许：${purpose}？`);
    return { approved: ok, ...getBatchOperationFields(info.suspendPayload) };
  };

  /**
   * 画布写操作的统一执行器（group_components / ungroup / move_components / add_panel_state ……）。
   * 审批、写入排队、出错处理都在 createCanvasOpsHandler 里，这里只接上真实的画布能力。
   */
  const handleCanvasOps: SuspendHandlerFn<SuspendType.CanvasOps> = createCanvasOpsHandler({
    getComponent: (id) => allComponentMap.value.get(`${id}`),
    confirm: (message) => confirm(sessionId, message),
    createComponent,
    createComponentFromConfig,
    deleteComponent: (id, placement) => onDeleteComponent(id, placement as ComponentPlacement),
    applyComponentUpdate,
    captureComponent: (id) => captureAndUploadCanvas(sessionId, { componentIds: [id] }),
    saveFilter: handleSaveFilter,
    deleteFilter,
    updateScreenInfo: async ({ screenId, detail, minioIds }) => {
      Object.assign(editConfig.value, detail);
      const filteredMinioIds = (minioIds ?? editConfig.value.minioIds ?? []).filter(
        (id: number | null | undefined) => id !== null && id !== undefined
      );
      await updateLargeScreen({
        id: screenId,
        detail: JSON.stringify(detail),
        minioIds: JSON.stringify(filteredMinioIds)
      });
    },
    moveComponents,
    groupComponents: handleSelectGroupAction,
    ungroupComponents: handleGroupDelete,
    addPanelState: async (panel, stateName) => {
      const panelData = (panel.panelData ?? []) as PanelState[];
      const newStatus = createLocalPanelStatus(panelData.length);
      newStatus.name = stateName;
      newStatus.title = stateName;
      panelData.push(newStatus);
      panel.panelData = panelData;
      await updateComponentLayers(panel, { syncWorkspace: false, updateHistoryType: UpdateHistoryTypeEnum.SKIP });
      // cloneDeep 同 createdComponentResult：画布上的对象是 Vue 响应式代理，过不了结构化克隆。
      return cloneDeep(newStatus) as unknown as Record<string, unknown>;
    }
  });

  /**
   * 在浏览器环境中执行一段 JS 脚本并返回结果。
   * @param script - 要执行的 JavaScript 代码
   */
  const runBrowserScript = async (script: string): Promise<{ ok: boolean; result?: string; error?: string }> => {
    try {
      const fn = new Function(`return (async () => { ${script} })()`);
      const result = await fn();
      return { ok: true, result: JSON.stringify(result) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  };

  /**
   * 直接执行浏览器脚本（AUTO 模式）。
   * @field script - 要执行的 JavaScript 代码
   */
  const handleExecuteInBrowser: SuspendHandlerFn<SuspendType.ExecuteInBrowser> = async (info) => {
    const { script } = info.suspendPayload;
    return runBrowserScript(script);
  };

  /**
   * 审批通过后执行浏览器脚本（ASK 模式下的 execute_in_browser）。
   * @field purpose - 审批目的说明
   * @field script - 要执行的 JavaScript 代码
   */
  const handleAskApprovalExecuteInBrowser: SuspendHandlerFn<SuspendType.AskApprovalExecuteInBrowser> = async (info) => {
    const { purpose, script } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否允许：${purpose}？`);
    if (!ok) {
      return { approved: false as const };
    }
    return runBrowserScript(script);
  };

  /**
   * 截取当前编辑器画布（或指定组件）并上传，回传 URL 供主模型看图自检（只读，不审批）。
   * @field componentIds - 只截这些组件；不传截整个画布
   */
  const handleCaptureCanvas: SuspendHandlerFn<SuspendType.CaptureCanvas> = async (info) => {
    const batch = getBatchOperationFields(info.suspendPayload);
    const capture = () => captureAndUploadCanvas(sessionId, info.suspendPayload);
    const result = await (batch.batchId ? enqueueCanvasMutation(capture) : capture());
    return { ...result, ...batch };
  };

  /**
   * 用户提交计划后展示计划摘要，根据用户选择的操作模式切换本地 AgentMode。
   * @field summary - 计划摘要
   * @field plan - 详细计划内容
   */
  const handleSubmitPlan: SuspendHandlerFn<SuspendType.SubmitPlan> = async (info) => {
    const { summary, plan } = info.suspendPayload;
    const result = await showSubmitPlan(sessionId, summary, plan);
    // 后端会按 action 改 thread.metadata.mode：auto_edit → AUTO_EDIT，ask_before_edit → ASK_BEFORE_EDIT，
    // keep_plan / reject 保持 PLAN。前端本地状态同步跟随，无需再发 update-thread。
    if (result.action === AgentMode.AUTO_EDIT) {
      applyLocalMode(AgentMode.AUTO_EDIT);
    } else if (result.action === AgentMode.ASK_BEFORE_EDIT) {
      applyLocalMode(AgentMode.ASK_BEFORE_EDIT);
    }
    return result;
  };

  /**
   * 请求用户确认是否进入计划模式，确认后同步切换本地 AgentMode。
   * @field reason - 进入计划模式的原因
   */
  const handleEnterPlanMode: SuspendHandlerFn<SuspendType.EnterPlanMode> = async (info) => {
    const { reason } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否进入计划模式？\n\n原因：${reason}`);
    if (ok) {
      // 后端在 approved=true 时会把 thread.metadata.mode 改成 PLAN，前端同步本地状态
      applyLocalMode(AgentMode.PLAN);
    }
    return { approved: ok };
  };

  /**
   * 向用户提出结构化多选题，等待回答后返回结果。
   * @field type - 固定值 "ask_user_question"
   * @field questions - 问题列表（1-4 个），每项含 question/header/options/multiSelect
   */
  const handleAskUserQuestion: SuspendHandlerFn<SuspendType.AskUserQuestion> = async (info) => {
    const { questions } = info.suspendPayload;
    return { answers: await askQuestion(sessionId, questions) };
  };

  /**
   * 保存模板时：用解析出的字段预填弹窗，用户复核/修改后保存为 AI 模板。
   * 后端已校验过模板完整性，这里只负责展示与保存。
   * @field name/embeddingText/tags/payload - 由后端从模板 JSON 解析出的预填值
   */
  const handleSaveAiTemplate: SuspendHandlerFn<SuspendType.SaveAiTemplate> = async (info) => {
    const { name, embeddingText, tags, payload } = info.suspendPayload;
    return showSaveAiTemplate(sessionId, { name, embeddingText, tags, payload });
  };

  /**
   * 模板检索后：把候选模板 id 列表交弹窗，用户选择并应用到当前大屏。
   * 应用后回传 templateId 与回写的范式描述文件路径，供 agent 读取继续修改。
   * @field templateIds - bi_search_template 命中的候选模板 id 列表
   */
  const handleApplyAiTemplate: SuspendHandlerFn<SuspendType.ApplyAiTemplate> = async (info) => {
    const { templateIds } = info.suspendPayload;
    return showApplyAiTemplate(sessionId, templateIds);
  };

  const suspendHandlers = new Map<SuspendType, SuspendHandlerFn<any>>([
    [SuspendType.AskUserQuestion, handleAskUserQuestion],
    [SuspendType.SaveAiTemplate, handleSaveAiTemplate],
    [SuspendType.ApplyAiTemplate, handleApplyAiTemplate],
    [SuspendType.EnterPlanMode, handleEnterPlanMode],
    [SuspendType.SubmitPlan, handleSubmitPlan],
    [SuspendType.AskApproval, handleAskApproval],
    [SuspendType.CanvasOps, handleCanvasOps],
    [SuspendType.ExecuteInBrowser, handleExecuteInBrowser],
    [SuspendType.AskApprovalExecuteInBrowser, handleAskApprovalExecuteInBrowser],
    [SuspendType.CaptureCanvas, handleCaptureCanvas]
  ]);

  return {
    suspendHandlers
  };
}
