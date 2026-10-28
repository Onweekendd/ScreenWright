import type { CanvasOp, OpResult, ResumeData, SuspendPayload, SuspendType } from "@screenwright/server/rpc";
import { ComponentSchema, type ComponentType } from "@screenwright/types";
import { cloneDeep } from "lodash-es";

import type { SuspendedToolInfo } from "../stream/useAgentBIStream";
import { componentMenuTitle } from "./componentMenuTitle";
import { enqueueCanvasMutation } from "./useCanvasMutationQueue";
import type {
  ComponentPlacement,
  CreateComponentOptions,
  CreateComponentResult,
  MoveComponentTarget
} from "./useCreateComponent";

/**
 * 画布写操作（`canvas_ops` 挂起）的前端执行器。
 *
 * 后端各工具把入参翻译成一批 `ops`，这里一个执行器 + 每种操作一个小函数：审批、写入排队、出错处理只写一遍。
 * 回执 `results[i]` 与 `ops[i]` 按下标一一对应；单个操作失败只记在自己那一项，不中断同批后面的。
 */

type CanvasOpsInfo = SuspendedToolInfo<SuspendPayload<SuspendType.CanvasOps>>;

/** edit_files 多轮 suspend 的关联字段；单文件工具调用时返回空对象。 */
export const getBatchOperationFields = (payload: { batchId?: string; operationId?: string }) =>
  payload.batchId && payload.operationId ? { batchId: payload.batchId, operationId: payload.operationId } : {};

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
export const createdComponentResult = (created: ComponentType | undefined, label = "组件创建成功"): OpResult =>
  created
    ? { ok: true, component: cloneDeep(created) as unknown as Record<string, unknown> }
    : { ok: false, error: `${label}但找不到对应实例` };

/** 执行器依赖的画布能力，由 useComponentStreamUpdater 用真实 hook 接线；单测里换成桩 */
export interface CanvasOpsDeps {
  /** 按数字 id 取画布上的组件实例（allComponentMap 的 key 是字符串，这里统一转） */
  getComponent: (id: number) => ComponentType | undefined;
  /** 弹审批确认框，返回用户是否同意 */
  confirm: (message: string) => Promise<boolean>;
  /** 按组件菜单建一个新组件（业务接口分配真实 id） */
  createComponent: (options: CreateComponentOptions) => Promise<CreateComponentResult>;
  /** 从一份完整配置（含子树）复制出新组件 */
  createComponentFromConfig: (config: ComponentType, placement?: ComponentPlacement) => Promise<CreateComponentResult>;
  /** 删除组件；placement 不传表示在根级 */
  deleteComponent: (
    id: number,
    placement?: ComponentPlacement
  ) => Promise<{ success: boolean; message: string } | void>;
  /** 把后端推来的组件增量合并到画布上的同 id 实例（merge 策略），并触发图层更新与关联关系同步 */
  applyComponentUpdate: (existing: ComponentType, incoming: ComponentType) => Promise<void>;
  /** 复用 capture_canvas 截图上传；在同一画布队列内、更新完成之后执行。 */
  captureComponent: (componentId: number) => Promise<ResumeData<SuspendType.CaptureCanvas>>;
  /** 保存过滤器；originalName 与 filter.name 不同即改名，需先删旧名 */
  saveFilter: (filter: OpOf<"save_filter">["filter"], originalName?: string) => Promise<unknown>;
  deleteFilter: (filterName: string) => Promise<{ success: boolean; error?: string }>;
  /** 更新大屏配置并持久化 */
  updateScreenInfo: (info: Pick<OpOf<"update_screen_info">, "screenId" | "detail" | "minioIds">) => Promise<void>;
  moveComponents: (ids: number[], target?: MoveComponentTarget) => Promise<{ success: boolean; message: string }>;
  /** 把组件组合成一个新分组，返回分组容器 */
  groupComponents: (components: ComponentType[]) => Promise<ComponentType | null | undefined>;
  /** 解散分组，子组件提升到上一级 */
  ungroupComponents: (groups: ComponentType[]) => Promise<void>;
  /** 给动态面板追加一个状态，返回画布上用的那一个 */
  addPanelState: (panel: ComponentType, stateName: string) => Promise<Record<string, unknown>>;
}

type OpOf<K extends CanvasOp["op"]> = Extract<CanvasOp, { op: K }>;

type OpHandlers = { [K in CanvasOp["op"]]: (op: Extract<CanvasOp, { op: K }>) => Promise<OpResult> };

const OK: OpResult = { ok: true };

const fail = (error: string): OpResult => ({ ok: false, error });

const createOpHandlers = (deps: CanvasOpsDeps): OpHandlers => ({
  /**
   * 把后端过 core 之后的那一份组件合并到画布上的同 id 实例。
   * 先过 ComponentSchema：载荷是后端校验过的，但前端合并进响应式树之前再挡一道，坏数据不进画布。
   */
  update_component: async ({ component, capture }) => {
    const parsed = ComponentSchema.parse(component);
    const existing = deps.getComponent(parsed.id);
    if (!existing) {
      return fail(`组件 ${parsed.id} 不存在`);
    }
    await deps.applyComponentUpdate(existing, parsed);
    if (capture) {
      try {
        return { ok: true, screenshot: await deps.captureComponent(parsed.id) };
      } catch (e) {
        // 已完成的编辑不能因为截图失败被误报成失败，避免模型重复提交相同修改。
        return { ok: true, screenshot: { ok: false, error: e instanceof Error ? e.message : String(e) } };
      }
    }
    return OK;
  },

  /** 保存过滤器。改名时 originalName 与 filter.name 不同，由 handleSaveFilter 先删旧名再存，避免新旧并存 */
  save_filter: async ({ filter, originalName }) => {
    await deps.saveFilter(filter, originalName);
    return OK;
  },

  delete_filter: async ({ filterName }) => {
    const result = await deps.deleteFilter(filterName);
    return result.success ? OK : fail(result.error ?? "过滤器删除失败");
  },

  update_screen_info: async ({ screenId, detail, minioIds }) => {
    await deps.updateScreenInfo({ screenId, detail, minioIds });
    return OK;
  },

  /**
   * 新建组件。整批在同一次画布写入里按顺序执行：批内的位置尺寸分配有先后依赖，
   * 中途不能被别的 tab 插进来，也不能并发——createComponent 会读画布当前状态做分配。
   */
  create_component: async ({ component, placement }) => {
    const result = await deps.createComponent({
      componentTitle: componentMenuTitle(component),
      componentConfig: component as Partial<ComponentType>,
      placement: placement as ComponentPlacement | undefined
    });
    if (!result.success || !result.componentId) {
      return fail(result.message);
    }
    return createdComponentResult(result.component, `组件创建成功（id=${result.componentId}）`);
  },

  /** 从已有配置复制创建组件 */
  copy_component: async ({ component, placement }) => {
    const result = await deps.createComponentFromConfig(
      component as unknown as ComponentType,
      placement as ComponentPlacement | undefined
    );
    if (!result.success || !result.componentId) {
      return fail(result.message);
    }
    return createdComponentResult(result.component, `组件复制成功（id=${result.componentId}）`);
  },

  /** 删除组件 */
  delete_component: async ({ componentId, placement }) => {
    const result = await deps.deleteComponent(componentId, placement as ComponentPlacement | undefined);
    return result && !result.success ? fail(result.message) : OK;
  },

  /**
   * 把已有组件组合成一个新分组。组件本身不会被删除或重建，只是从原容器摘除、挂到新分组下。
   * 分组容器的真实 id 同样来自业务接口，所以跟新建/复制走同一条回传路。
   */
  group_components: async ({ componentIds }) => {
    const components = componentIds.map(deps.getComponent).filter(Boolean) as ComponentType[];
    if (components.length !== componentIds.length) {
      return fail("部分组件未找到");
    }
    const groupItem = await deps.groupComponents(components);
    if (!groupItem) {
      return fail("分组失败");
    }
    return createdComponentResult(groupItem, `分组创建成功（id=${groupItem.id}）`);
  },

  /**
   * 解散分组，子组件提升到上一级。分组容器本身随之消失，子组件不会重建。
   * 解散不产生新 id，后端跑同一个 core ungroup 就能算出谁被提升到哪，新路径由它改完自己的树再扫盘推，
   * 这里只回一句「干完了」。
   */
  ungroup: async ({ groupIds }) => {
    const groups = groupIds.map(deps.getComponent).filter(Boolean) as ComponentType[];
    if (groups.length !== groupIds.length) {
      return fail("部分分组未找到");
    }
    await deps.ungroupComponents(groups);
    return OK;
  },

  /**
   * 把组件移动到另一个容器。组件本身不会被删除或重建，只是从当前容器摘除、挂到目标容器下，
   * id 与对象引用不变；新路径由后端跑同一个 core move 之后扫盘推。
   */
  move_components: async ({ componentIds, target }) => {
    const result = await deps.moveComponents(componentIds, target);
    return result.success ? OK : fail(result.message);
  },

  /**
   * 给动态面板新增一个状态。状态 id 是本地 uuid，后端也造得出来——但画布上已经用的是这一个，
   * 回传它才对得上。
   */
  add_panel_state: async ({ panelId, stateName }) => {
    const panel = deps.getComponent(panelId);
    if (!panel) {
      return fail(`找不到动态面板 ${panelId}`);
    }
    return { ok: true, state: await deps.addPanelState(panel, stateName) };
  }
});

/**
 * 造 `canvas_ops` 的挂起处理函数。
 * - 有 `approval`：先弹一次确认（整批一次）。确认在入队**之前**——等审批不能卡住别的 tab 的画布写入；
 * - 整批放进**一次** `enqueueCanvasMutation`：批内有先后依赖，不能被别的 tab 插进来。
 */
export const createCanvasOpsHandler = (deps: CanvasOpsDeps) => {
  const handlers = createOpHandlers(deps);

  const run = async (op: CanvasOp): Promise<OpResult> => {
    try {
      return await handlers[op.op](op as never);
    } catch (e) {
      return fail((e as Error).message);
    }
  };

  return async (info: CanvasOpsInfo): Promise<ResumeData<SuspendType.CanvasOps>> => {
    const { approval, ops } = info.suspendPayload;
    const batch = getBatchOperationFields(info.suspendPayload);
    if (approval && !(await deps.confirm(`是否允许：${approval.purpose}？`))) {
      return { approved: false, ...batch };
    }
    return enqueueCanvasMutation(async () => {
      const results: OpResult[] = [];
      for (const op of ops) {
        results.push(await run(op));
      }
      return { results, ...batch };
    });
  };
};
