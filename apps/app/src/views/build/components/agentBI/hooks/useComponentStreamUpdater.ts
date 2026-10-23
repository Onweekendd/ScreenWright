import { AgentMode, apiClient, type ResumeData, type SuspendPayload, SuspendType } from "@screenwright/server/rpc";
import { ComponentSchema, type ComponentType } from "@screenwright/types";
import { cloneDeep } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import type { PanelState } from "../../buildRender/core/SystemComponent/type";
import { UpdateHistoryTypeEnum, useAction } from "../../buildRender/hooks/useAction";
import { createLocalPanelStatus } from "../../buildRender/hooks/useCommonPanelAction";
import { useEditStore } from "../../buildRender/hooks/useEditStore";
import { createCanvasOpsHandler, getBatchOperationFields } from "./canvasOps";
import { captureCanvasForAgent } from "./captureCanvasForAgent";
import { componentMenuTitle } from "./componentMenuTitle";
import type { SuspendedToolInfo } from "./useAgentBIStream";
import { enqueueCanvasMutation } from "./useCanvasMutationQueue";
import { useConfirm } from "./useConfirm";
import type { ComponentPlacement } from "./useCreateComponent";
import { useCreateComponent } from "./useCreateComponent";

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

  /**
   * 把建好的组件交回后端，由它过 core 放进树、整屏落盘、推导真实路径。
   * 新建 / 复制 / 成组三条路共用——它们的共同点是产生了一个**只有前端拿得到的真实 id**。
   *
   * 回的是整个组件而不是 id 或路径：真实 id 只有业务接口能分配，实例还要套组件菜单默认值、
   * 跑一遍位置尺寸分配，画布上的那份跟后端发过来的 template 不是同一个东西。
   * 路径同理不在这边拼——文件名带白名单净化与长度截断，命名规则归写文件的人（后端 buildIdNameBase）。
   *
   * cloneDeep 不能省：组件在画布上是 Vue 响应式代理，直接塞进 resume 会带着代理过结构化克隆。
   */
  const createdComponentPayload = (created: ComponentType | undefined, componentId: number, label = "组件创建成功") =>
    created ? { component: cloneDeep(created) } : { error: `${label}（id=${componentId}）但找不到对应实例` };

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
   * 按顺序创建一批组件，逐个产出回执。
   *
   * 整批放进同一次画布写入队列：批内的组件位置尺寸分配有先后依赖，中途不能被别的 tab 插进来；
   * 顺序也不能并发——createComponent 会读画布当前状态做分配。
   * 单个失败只记在该项回执上，不中断同批后面的组件（它们互相独立，agent 只需重试失败的）。
   */
  const createComponentItems = (items: SuspendPayload<SuspendType.CreateComponent>["items"]) =>
    enqueueCanvasMutation(async () => {
      const results: NonNullable<ResumeData<SuspendType.CreateComponent>["results"]> = [];
      for (const { index, component, placement } of items) {
        try {
          const result = await createComponent({
            componentTitle: componentMenuTitle(component),
            componentConfig: component as Partial<ComponentType>,
            placement: placement as ComponentPlacement | undefined
          });
          results.push({
            index,
            ...(!result.success || !result.componentId
              ? { error: result.message }
              : createdComponentPayload(result.component, result.componentId))
          });
        } catch (e) {
          results.push({ index, error: (e as Error).message });
        }
      }
      return { results };
    });

  /**
   * 审批通过后立即创建组件（ASK 模式下的 create_component）；整批只审批一次。
   * @field purpose - 审批目的说明
   * @field items - 待创建的组件（配置 + 放置信息），index 回执时原样带回
   */
  const handleAskApprovalCreateComponent: SuspendHandlerFn<SuspendType.AskApprovalCreateComponent> = async (info) => {
    const { purpose, items } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否允许：${purpose}？`);
    if (!ok) {
      return { approved: false };
    }
    return createComponentItems(items);
  };

  /**
   * 审批通过后立即删除组件（ASK 模式下的 delete_component）。
   * @field purpose - 审批目的说明
   * @field componentId - 待删除的组件 ID
   * @field placement - 组件放置信息
   */
  const handleAskApprovalDeleteComponent: SuspendHandlerFn<SuspendType.AskApprovalDeleteComponent> = async (info) => {
    const { purpose, componentId, placement } = info.suspendPayload;
    const component = allComponentMap.value.get(componentId);
    const name = component?.name || component?.title;
    const message = name ? `是否允许：${purpose}「${name}」？` : `是否允许：${purpose}？`;
    const ok = await confirm(sessionId, message);
    if (!ok) {
      return { approved: false };
    }
    return enqueueCanvasMutation(async () => {
      try {
        const result = await onDeleteComponent(Number(componentId), placement as ComponentPlacement);
        if (result && !result.success) {
          return { error: result.message };
        }
        return { componentId: Number(componentId) };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
  };

  /**
   * 画布写操作的统一执行器（group_components / ungroup / move_components / add_panel_state ……）。
   * 审批、写入排队、出错处理都在 createCanvasOpsHandler 里，这里只接上真实的画布能力。
   */
  const handleCanvasOps: SuspendHandlerFn<SuspendType.CanvasOps> = createCanvasOpsHandler({
    getComponent: (id) => allComponentMap.value.get(`${id}`),
    confirm: (message) => confirm(sessionId, message),
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
   * 直接创建组件（AUTO 模式）。
   * @field items - 待创建的组件（配置 + 放置信息），name/title 用于标题
   */
  const handleCreateComponent: SuspendHandlerFn<SuspendType.CreateComponent> = async (info) =>
    createComponentItems(info.suspendPayload.items);

  /**
   * 从已有配置复制创建组件。
   * @field component - 源组件完整配置
   * @field placement - 组件放置信息
   */
  const handleCopyComponent: SuspendHandlerFn<SuspendType.CopyComponent> = async (info) => {
    const { component, placement } = info.suspendPayload;
    return enqueueCanvasMutation(async () => {
      try {
        const result = await createComponentFromConfig(
          component as ComponentType,
          placement as ComponentPlacement | undefined
        );
        if (!result.success || !result.componentId) {
          return { error: result.message };
        }
        return createdComponentPayload(result.component, result.componentId, "组件复制成功");
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
  };

  /**
   * 审批通过后从已有配置复制创建组件（ASK 模式下的 copy_component）。
   * @field purpose - 审批目的说明
   * @field component - 源组件完整配置
   * @field placement - 组件放置信息
   */
  const handleAskApprovalCopyComponent: SuspendHandlerFn<SuspendType.AskApprovalCopyComponent> = async (info) => {
    const { purpose, component, placement } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否允许：${purpose}？`);
    if (!ok) {
      return { approved: false };
    }
    return enqueueCanvasMutation(async () => {
      try {
        const result = await createComponentFromConfig(
          component as ComponentType,
          placement as ComponentPlacement | undefined
        );
        if (!result.success || !result.componentId) {
          return { error: result.message };
        }
        return createdComponentPayload(result.component, result.componentId, "组件复制成功");
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
  };

  /**
   * 直接删除组件（AUTO 模式）。
   * @field componentId - 待删除的组件 ID
   * @field placement - 组件放置信息
   */
  const handleDeleteComponent: SuspendHandlerFn<SuspendType.DeleteComponent> = async (info) => {
    const { componentId, placement } = info.suspendPayload;
    return enqueueCanvasMutation(async () => {
      try {
        const result = await onDeleteComponent(Number(componentId), placement as ComponentPlacement);
        if (result && !result.success) {
          return { error: result.message };
        }
        return { componentId: Number(componentId) };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
  };

  /**
   * 保存过滤器到前端（AUTO 模式）。
   * @field filterName - 过滤器名称
   * @field originalName - 编辑前的过滤器名，与 filterName 不同即为改名
   * @field filter - 过滤器完整配置
   * @field replacements - 本次编辑的替换次数
   */
  const handleSaveFilterSuspend: SuspendHandlerFn<SuspendType.SaveFilter> = async (info) => {
    const { filter, originalName, replacements } = info.suspendPayload;
    const batchOperation = getBatchOperationFields(info.suspendPayload);
    return enqueueCanvasMutation(async () => {
      try {
        await handleSaveFilter(filter, originalName);
        return { filterSaved: true, replacements, ...batchOperation };
      } catch (e) {
        return { filterSaved: false, error: (e as Error).message, replacements, ...batchOperation };
      }
    });
  };

  /**
   * 将后端推送的组件增量合并到前端实例（AUTO 模式）。
   * @field component - 后端推送的已校验组件数据
   * @field replacements - 本次编辑的替换次数
   */
  const handlePushComponentUpdate: SuspendHandlerFn<SuspendType.PushComponentUpdate> = async (info) => {
    const { component, replacements } = info.suspendPayload;
    const batchOperation = getBatchOperationFields(info.suspendPayload);
    return enqueueCanvasMutation(async () => {
      try {
        const parsed = ComponentSchema.parse(component);
        const rawComponent = allComponentMap.value.get(`${parsed.id}`);
        if (!rawComponent) {
          return { componentUpdated: false, error: `组件 ${parsed.id} 不存在`, replacements, ...batchOperation };
        }
        await applyComponentUpdate(rawComponent, parsed);
        return { componentUpdated: true, replacements, ...batchOperation };
      } catch (e) {
        return { componentUpdated: false, error: (e as Error).message, replacements, ...batchOperation };
      }
    });
  };

  /**
   * 审批通过后推送组件更新（ASK 模式下的 push_component_update）。
   * @field purpose - 审批目的说明
   * @field component - 后端推送的已校验组件数据
   * @field replacements - 本次编辑的替换次数
   */
  const handleAskApprovalPushComponentUpdate: SuspendHandlerFn<SuspendType.AskApprovalPushComponentUpdate> = async (
    info
  ) => {
    const { purpose } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否允许：${purpose}？`);
    if (!ok) {
      return { approved: false, ...getBatchOperationFields(info.suspendPayload) };
    }
    return handlePushComponentUpdate({
      ...info,
      suspendPayload: {
        type: SuspendType.PushComponentUpdate,
        component: info.suspendPayload.component,
        replacements: info.suspendPayload.replacements,
        ...getBatchOperationFields(info.suspendPayload)
      }
    });
  };

  /**
   * 直接删除过滤器（AUTO 模式）。
   * @field filterName - 待删除的过滤器名称
   */
  const handleDeleteFilter: SuspendHandlerFn<SuspendType.DeleteFilter> = async (info) => {
    const { filterName } = info.suspendPayload;
    return enqueueCanvasMutation(async () => {
      const result = await deleteFilter(filterName);
      return result.success ? { filterDeleted: true } : { filterDeleted: false, error: result.error };
    });
  };

  /**
   * 审批通过后删除过滤器（ASK 模式下的 delete_filter）。
   * @field purpose - 审批目的说明
   * @field filterName - 待删除的过滤器名称
   */
  const handleAskApprovalDeleteFilter: SuspendHandlerFn<SuspendType.AskApprovalDeleteFilter> = async (info) => {
    const { purpose, filterName } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否允许：${purpose}「${filterName}」？`);
    if (!ok) {
      return { approved: false };
    }
    return enqueueCanvasMutation(async () => {
      const result = await deleteFilter(filterName);
      return result.success ? { filterDeleted: true } : { filterDeleted: false, error: result.error };
    });
  };

  /**
   * 审批通过后保存过滤器（ASK 模式下的 save_filter）。
   * @field purpose - 审批目的说明
   * @field filterName - 过滤器名称
   * @field originalName - 编辑前的过滤器名，与 filterName 不同即为改名
   * @field filter - 过滤器完整配置
   */
  const handleAskApprovalSaveFilter: SuspendHandlerFn<SuspendType.AskApprovalSaveFilter> = async (info) => {
    const { purpose, filter, originalName } = info.suspendPayload;
    const batchOperation = getBatchOperationFields(info.suspendPayload);
    const ok = await confirm(sessionId, `是否允许：${purpose}？`);
    if (!ok) {
      return { approved: false, ...batchOperation };
    }
    return enqueueCanvasMutation(async () => {
      try {
        await handleSaveFilter(filter, originalName);
        return { filterSaved: true, ...batchOperation };
      } catch (e) {
        return { filterSaved: false, error: (e as Error).message, ...batchOperation };
      }
    });
  };

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
    try {
      const { componentIds, region: wantedRegion, grid, gridStep: wantedStep, snap } = info.suspendPayload;
      const { file, width, height, region, scale, gridStep, snapped, missingIds } = await captureCanvasForAgent({
        componentIds,
        region: wantedRegion,
        grid,
        gridStep: wantedStep,
        snap
      });
      const res = await apiClient.customApi["chat-images"].upload.$post({
        form: { conversationId: sessionId, file }
      });
      const data = await res.json();
      if (!data.success) {
        return { ok: false, error: "截图上传失败" };
      }
      return { ok: true, url: data.data.url, width, height, region, scale, gridStep, snapped, missingIds };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
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
   * 直接更新大屏配置并持久化（AUTO 模式）。
   * @field screenId - 大屏 ID
   * @field detail - 大屏详细配置
   * @field minioIds - MinIO 资源 ID 列表
   * @field replacements - 本次编辑的替换次数
   */
  const handleUpdateScreenInfo: SuspendHandlerFn<SuspendType.UpdateScreenInfo> = async (info) => {
    const { screenId, detail, minioIds, replacements } = info.suspendPayload;
    const batchOperation = getBatchOperationFields(info.suspendPayload);
    return enqueueCanvasMutation(async () => {
      try {
        Object.assign(editConfig.value, detail);
        const filteredMinioIds = (minioIds ?? editConfig.value.minioIds ?? []).filter(
          (id: number | null | undefined) => id !== null && id !== undefined
        );
        await updateLargeScreen({
          id: screenId,
          detail: JSON.stringify(detail),
          minioIds: JSON.stringify(filteredMinioIds)
        });
        return { screenInfoUpdated: true, replacements, ...batchOperation };
      } catch (e) {
        return { screenInfoUpdated: false, error: (e as Error).message, replacements, ...batchOperation };
      }
    });
  };

  /**
   * 审批通过后更新大屏配置（ASK 模式下的 update_screen_info）。
   * @field purpose - 审批目的说明
   */
  const handleAskApprovalUpdateScreenInfo: SuspendHandlerFn<SuspendType.AskApprovalUpdateScreenInfo> = async (info) => {
    const { purpose } = info.suspendPayload;
    const ok = await confirm(sessionId, `是否允许：${purpose}？`);
    if (!ok) {
      return { approved: false, ...getBatchOperationFields(info.suspendPayload) };
    }
    return handleUpdateScreenInfo({
      ...info,
      suspendPayload: {
        type: SuspendType.UpdateScreenInfo,
        screenId: info.suspendPayload.screenId,
        detail: info.suspendPayload.detail,
        minioIds: info.suspendPayload.minioIds,
        replacements: info.suspendPayload.replacements,
        ...getBatchOperationFields(info.suspendPayload)
      }
    });
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
   * 模板提取后：用解析出的字段预填弹窗，用户复核/修改后保存为 AI 模板。
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
    [SuspendType.SaveFilter, handleSaveFilterSuspend],
    [SuspendType.AskApprovalSaveFilter, handleAskApprovalSaveFilter],
    [SuspendType.DeleteFilter, handleDeleteFilter],
    [SuspendType.AskApprovalDeleteFilter, handleAskApprovalDeleteFilter],
    [SuspendType.PushComponentUpdate, handlePushComponentUpdate],
    [SuspendType.AskApprovalPushComponentUpdate, handleAskApprovalPushComponentUpdate],
    [SuspendType.AskApprovalCreateComponent, handleAskApprovalCreateComponent],
    [SuspendType.AskApprovalDeleteComponent, handleAskApprovalDeleteComponent],
    [SuspendType.CreateComponent, handleCreateComponent],
    [SuspendType.CopyComponent, handleCopyComponent],
    [SuspendType.AskApprovalCopyComponent, handleAskApprovalCopyComponent],
    [SuspendType.DeleteComponent, handleDeleteComponent],
    [SuspendType.CanvasOps, handleCanvasOps],
    [SuspendType.ExecuteInBrowser, handleExecuteInBrowser],
    [SuspendType.AskApprovalExecuteInBrowser, handleAskApprovalExecuteInBrowser],
    [SuspendType.CaptureCanvas, handleCaptureCanvas],
    [SuspendType.UpdateScreenInfo, handleUpdateScreenInfo],
    [SuspendType.AskApprovalUpdateScreenInfo, handleAskApprovalUpdateScreenInfo]
  ]);

  return {
    suspendHandlers
  };
}
