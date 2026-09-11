import { ComponentSchema, FilterSchema, LargeScreenDetailInfoSchema } from "@screenwright/types/schemas";
import { z } from "zod";

/**
 * 所有合法的 suspend type 字符串枚举。
 * 运行时唯一来源：`SuspendDefs` 的键、`z.literal`、tool 的 `suspend()` 调用、前端 `suspendHandlers` Map
 * 均引用此枚举，避免裸字符串漂移。
 */
export enum SuspendType {
  /** 通用审批：弹确认框，后端按 approved 自行处理后续（edit_files、createEventTemplate） */
  AskApproval = "ask_approval",
  /** 向用户提出结构化多选题，等待回答后继续执行 */
  AskUserQuestion = "ask_user_question",
  /** 请求进入计划模式 */
  EnterPlanMode = "enter_plan_mode",
  /** 提交计划，等待用户选择执行策略（auto_edit / ask_before_edit / keep_plan / reject） */
  SubmitPlan = "submit_plan",
  /** AUTO 模式：直接将后端推送的组件增量合并到前端 */
  PushComponentUpdate = "push_component_update",
  /** ASK 模式：审批通过后再推送组件更新 */
  AskApprovalPushComponentUpdate = "ask_approval_push_component_update",
  /** AUTO 模式：直接创建组件 */
  CreateComponent = "create_component",
  /** ASK 模式：审批通过后创建组件 */
  AskApprovalCreateComponent = "ask_approval_create_component",
  /** AUTO 模式：直接删除组件 */
  DeleteComponent = "delete_component",
  /** ASK 模式：审批通过后删除组件 */
  AskApprovalDeleteComponent = "ask_approval_delete_component",
  /** AUTO 模式：从已有配置复制创建组件 */
  CopyComponent = "copy_component",
  /** ASK 模式：审批通过后从已有配置复制创建组件 */
  AskApprovalCopyComponent = "ask_approval_copy_component",
  /** AUTO 模式：直接保存过滤器 */
  SaveFilter = "save_filter",
  /** ASK 模式：审批通过后保存过滤器 */
  AskApprovalSaveFilter = "ask_approval_save_filter",
  /** AUTO 模式：直接删除过滤器 */
  DeleteFilter = "delete_filter",
  /** ASK 模式：审批通过后删除过滤器 */
  AskApprovalDeleteFilter = "ask_approval_delete_filter",
  /** AUTO 模式：直接在浏览器执行脚本 */
  ExecuteInBrowser = "execute_in_browser",
  /** ASK 模式：审批通过后在浏览器执行脚本 */
  AskApprovalExecuteInBrowser = "ask_approval_execute_in_browser",
  /** AUTO 模式：直接更新大屏配置并持久化 */
  UpdateScreenInfo = "update_screen_info",
  /** ASK 模式：审批通过后更新大屏配置 */
  AskApprovalUpdateScreenInfo = "ask_approval_update_screen_info",
  /** 模板提取后：把解析出的模板字段交前端预填弹窗，由用户确认/修改后保存为 AI 模板 */
  SaveAiTemplate = "save_ai_template",
  /** 模板检索后：把候选模板 id 列表交前端弹窗（封面+适用场景），由用户选择并应用到当前大屏 */
  ApplyAiTemplate = "apply_ai_template",
  /** AUTO 模式：直接把已有组件组合成一个新分组 */
  GroupComponent = "group_component",
  /** ASK 模式：审批通过后把已有组件组合成一个新分组 */
  AskApprovalGroupComponent = "ask_approval_group_component",
  /** AUTO 模式：直接解散分组，子组件提升到上一级 */
  UngroupComponent = "ungroup_component",
  /** ASK 模式：审批通过后解散分组 */
  AskApprovalUngroupComponent = "ask_approval_ungroup_component",
  /** AUTO 模式：直接把组件移动到另一个容器（分组/动态面板状态/根级） */
  MoveComponent = "move_component",
  /** ASK 模式：审批通过后移动组件 */
  AskApprovalMoveComponent = "ask_approval_move_component",
  /** AUTO 模式：直接给动态面板新增一个状态 */
  AddPanelState = "add_panel_state",
  /** ASK 模式：审批通过后给动态面板新增一个状态 */
  AskApprovalAddPanelState = "ask_approval_add_panel_state"
}

export const SuspendTypeSchema = z.enum(SuspendType);

const placementSchema = z
  .object({
    parentId: z.number(),
    parentType: z.enum(["group", "dynamicPanel"]),
    stateId: z.string().optional()
  })
  .optional();

/**
 * 前端建好并回传的组件（新建 / 复制 / 新分组容器共用）。
 *
 * 回的是**整个组件**而不是一个 id 或 filePath：真实 id 只有业务接口能分配，实例还要套组件菜单的
 * 默认值、跑一遍位置尺寸分配，落在画布上的那份跟后端发过去的 template 不是同一个东西。后端拿着
 * 这一份过 core 放进树、整屏落盘，路径由后端从自己的树推——工作区因此只有一个写入者，
 * 前端不必再 syncWorkspace，也不会出现「resume 回来了但文件还在 debounce 里没写」的竞态。
 */
const componentCreatedFromFrontend = z
  .record(z.string(), z.unknown())
  .optional()
  .describe("前端建好的组件（含业务接口分配的真实 id）；后端据此过 core 放进树并整屏回写");

/**
 * 不产生新 id 的那类操作（移动 / 解组 / 删除）的回执：**只回一个「干完了」**。
 *
 * 这些操作前端没有任何后端算不出来的东西——没有新 id、没有新实例，摘挂与包围盒重算两边跑的
 * 是 core 里同一个函数。所以路径不由前端拼了：它一手写就得跟落盘侧的文件名净化规则逐字对齐，
 * 对不上也不报错，只是 agent 拿到一个不存在的路径。后端改完自己的树，扫盘推真实路径。
 */
const frontendApplied = (label: string) => z.boolean().optional().describe(`前端已${label}；后端据此过 core 落盘`);

/**
 * 前端建好并回传的动态面板状态。
 *
 * 与组件不同，状态 id 是本地 uuid、不经业务接口，后端自己也造得出来——但**画布上已经用这个 id
 * 建好了**，后端再造一个就跟画布对不上。前后端造状态跑的是 core 里同一个 createPanelState。
 */
const panelStateCreatedFromFrontend = z
  .record(z.string(), z.unknown())
  .optional()
  .describe("前端建好的状态（含它在画布上用的 id）；后端据此过 core 追加进 panelData 并整屏回写");

/** edit_files 批次中的单项标识。普通单文件工具调用不传，保持既有协议兼容。 */
const batchOperationFields = {
  batchId: z.string().optional(),
  operationId: z.string().optional()
} as const;

const questionSchema = z.object({
  question: z.string().describe("完整的问题文本，以问号结尾"),
  header: z.string().describe("简短标签，用于显示为标题（最多15字）"),
  options: z
    .array(
      z.object({
        label: z.string().describe("选项显示文本，简洁明了（1-5个词）"),
        description: z.string().describe("选项说明，解释选择此项的含义或影响")
      })
    )
    .min(2)
    .max(4),
  multiSelect: z.boolean().default(false).describe("是否允许多选")
});

/** 单个问题选项，与 `questionSchema` 中的 options 元素类型一致 */
export type QuestionOption = z.infer<typeof questionSchema>["options"][number];
/** 结构化问题，与 `questionSchema` 推断类型一致 */
export type AskUserQuestion = z.infer<typeof questionSchema>;

/**
 * 所有 suspend type 的 schema 定义，以 `SuspendType` 枚举为键。
 * 每个条目包含 `suspend`（挂起载荷 schema）和 `resume`（恢复数据 schema）。
 * tool 文件通过 `SuspendDefs[SuspendType.X].suspend/resume` 引用，确保与此处保持同步。
 */
export const SuspendDefs = {
  [SuspendType.AskApproval]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApproval),
      purpose: z.string(),
      filePath: z.string(),
      edits: z.array(z.object({ oldString: z.string(), newString: z.string() })),
      ...batchOperationFields
    }),
    resume: z.object({ approved: z.boolean(), ...batchOperationFields })
  },

  [SuspendType.AskUserQuestion]: {
    suspend: z.object({ type: z.literal(SuspendType.AskUserQuestion), questions: z.array(questionSchema) }),
    resume: z.object({ answers: z.record(z.string(), z.string()) })
  },

  [SuspendType.EnterPlanMode]: {
    suspend: z.object({
      type: z.literal(SuspendType.EnterPlanMode),
      reason: z.string().describe("触发计划模式的原因"),
      task: z.string().optional().describe("当前任务描述")
    }),
    resume: z.object({ approved: z.boolean().describe("是否同意进入计划模式") })
  },
  [SuspendType.SubmitPlan]: {
    suspend: z.object({
      type: z.literal(SuspendType.SubmitPlan),
      summary: z.string(),
      plan: z.string().describe("从计划文件读取的完整内容"),
      filePath: z.string()
    }),
    resume: z.object({
      action: z
        .enum(["auto_edit", "ask_before_edit", "keep_plan", "reject"])
        .describe("用户选择的操作：auto_edit/ask_before_edit 批准并退出计划模式，keep_plan 保持计划模式，reject 拒绝"),
      feedback: z.string().optional().describe("拒绝时的修改意见")
    })
  },

  [SuspendType.PushComponentUpdate]: {
    suspend: z.object({
      type: z.literal(SuspendType.PushComponentUpdate),
      component: ComponentSchema,
      replacements: z.number(),
      ...batchOperationFields
    }),
    resume: z.object({
      componentUpdated: z.boolean(),
      replacements: z.number().optional(),
      error: z.string().optional(),
      ...batchOperationFields
    })
  },
  [SuspendType.AskApprovalPushComponentUpdate]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalPushComponentUpdate),
      purpose: z.string(),
      component: ComponentSchema,
      replacements: z.number(),
      ...batchOperationFields
    }),
    resume: z.union([
      z.object({ approved: z.literal(false), ...batchOperationFields }),
      z.object({
        componentUpdated: z.boolean(),
        replacements: z.number().optional(),
        error: z.string().optional(),
        ...batchOperationFields
      })
    ])
  },

  [SuspendType.CreateComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.CreateComponent),
      component: z.record(z.string(), z.unknown()),
      placement: placementSchema
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准操作"),
      component: componentCreatedFromFrontend,
      error: z.string().optional().describe("前端创建组件失败时的错误信息")
    })
  },
  [SuspendType.AskApprovalCreateComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalCreateComponent),
      purpose: z.string(),
      /** 组件创建后才由前端分配真实路径，创建请求本身无路径可带；保留为可选仅为兼容既有 payload */
      filePath: z.string().optional(),
      component: z.record(z.string(), z.unknown()),
      placement: placementSchema
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准操作"),
      component: componentCreatedFromFrontend,
      error: z.string().optional().describe("前端创建组件失败时的错误信息")
    })
  },

  [SuspendType.DeleteComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.DeleteComponent),
      componentId: z.string(),
      placement: placementSchema
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准删除操作"),
      componentId: z.number().optional().describe("前端为新组件分配的真实 ID"),
      error: z.string().optional().describe("前端删除组件失败时的错误信息")
    })
  },
  [SuspendType.AskApprovalDeleteComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalDeleteComponent),
      purpose: z.string(),
      componentId: z.string(),
      placement: placementSchema
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准删除操作"),
      componentId: z.number().optional().describe("前端为新组件分配的真实 ID"),
      error: z.string().optional().describe("前端删除组件失败时的错误信息")
    })
  },

  [SuspendType.CopyComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.CopyComponent),
      component: z.record(z.string(), z.unknown()),
      placement: placementSchema
    }),
    resume: z.object({
      component: componentCreatedFromFrontend,
      error: z.string().optional().describe("前端创建组件失败时的错误信息")
    })
  },
  [SuspendType.AskApprovalCopyComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalCopyComponent),
      purpose: z.string(),
      component: z.record(z.string(), z.unknown()),
      placement: placementSchema
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准复制操作"),
      component: componentCreatedFromFrontend,
      error: z.string().optional().describe("前端创建组件失败时的错误信息")
    })
  },

  [SuspendType.SaveFilter]: {
    suspend: z.object({
      type: z.literal(SuspendType.SaveFilter),
      filterName: z.string(),
      originalName: z
        .string()
        .optional()
        .describe("编辑前的过滤器名；与 filterName 不同即为改名，前端需先删旧名再保存，否则新旧并存"),
      filter: FilterSchema,
      replacements: z.number().optional(),
      ...batchOperationFields
    }),
    resume: z.object({
      filterSaved: z.boolean(),
      replacements: z.number().optional(),
      error: z.string().optional(),
      ...batchOperationFields
    })
  },
  [SuspendType.AskApprovalSaveFilter]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalSaveFilter),
      purpose: z.string(),
      filterName: z.string(),
      originalName: z
        .string()
        .optional()
        .describe("编辑前的过滤器名；与 filterName 不同即为改名，前端需先删旧名再保存，否则新旧并存"),
      filter: FilterSchema,
      replacements: z.number().optional(),
      ...batchOperationFields
    }),
    resume: z.union([
      z.object({ approved: z.literal(false), ...batchOperationFields }),
      z.object({
        filterSaved: z.boolean(),
        replacements: z.number().optional(),
        error: z.string().optional(),
        ...batchOperationFields
      })
    ])
  },
  [SuspendType.DeleteFilter]: {
    suspend: z.object({ type: z.literal(SuspendType.DeleteFilter), filterName: z.string() }),
    resume: z.object({ filterDeleted: z.boolean(), error: z.string().optional() })
  },
  [SuspendType.AskApprovalDeleteFilter]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalDeleteFilter),
      purpose: z.string(),
      filterName: z.string()
    }),
    resume: z.union([
      z.object({ approved: z.literal(false) }),
      z.object({ filterDeleted: z.boolean(), error: z.string().optional() })
    ])
  },

  [SuspendType.ExecuteInBrowser]: {
    suspend: z.object({ type: z.literal(SuspendType.ExecuteInBrowser), script: z.string() }),
    resume: z.object({ ok: z.boolean(), result: z.string().optional(), error: z.string().optional() })
  },
  [SuspendType.AskApprovalExecuteInBrowser]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalExecuteInBrowser),
      purpose: z.string(),
      script: z.string()
    }),
    resume: z.union([
      z.object({ ok: z.boolean(), result: z.string().optional(), error: z.string().optional() }),
      z.object({ approved: z.literal(false) })
    ])
  },

  [SuspendType.UpdateScreenInfo]: {
    suspend: z.object({
      type: z.literal(SuspendType.UpdateScreenInfo),
      screenId: z.number(),
      detail: LargeScreenDetailInfoSchema,
      minioIds: z.array(z.union([z.number(), z.null()])).optional(),
      replacements: z.number(),
      ...batchOperationFields
    }),
    resume: z.object({
      screenInfoUpdated: z.boolean(),
      replacements: z.number().optional(),
      error: z.string().optional(),
      ...batchOperationFields
    })
  },
  [SuspendType.AskApprovalUpdateScreenInfo]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalUpdateScreenInfo),
      purpose: z.string(),
      screenId: z.number(),
      detail: LargeScreenDetailInfoSchema,
      minioIds: z.array(z.union([z.number(), z.null()])).optional(),
      replacements: z.number(),
      ...batchOperationFields
    }),
    resume: z.union([
      z.object({ approved: z.literal(false), ...batchOperationFields }),
      z.object({
        screenInfoUpdated: z.boolean(),
        replacements: z.number().optional(),
        error: z.string().optional(),
        ...batchOperationFields
      })
    ])
  },

  [SuspendType.SaveAiTemplate]: {
    suspend: z.object({
      type: z.literal(SuspendType.SaveAiTemplate),
      name: z.string().describe("模板名称（由模板 JSON 的「模板名称」解析得到，用于弹窗预填）"),
      embeddingText: z.string().describe("嵌入摘要原文（「嵌入摘要」），送向量库做语义检索"),
      tags: z.array(z.string()).describe("AI 匹配语义标签（「AI匹配语义标签」），弹窗预填的标签数组"),
      payload: z.string().describe("整份模板范式 JSON 的字符串，供弹窗 Monaco 编辑器展示/编辑")
    }),
    resume: z.object({
      saved: z.boolean().describe("用户是否完成保存"),
      templateId: z.number().optional().describe("保存成功后后端返回的 AI 模板 ID"),
      canceled: z.boolean().optional().describe("用户主动取消时为 true")
    })
  },

  [SuspendType.ApplyAiTemplate]: {
    suspend: z.object({
      type: z.literal(SuspendType.ApplyAiTemplate),
      templateIds: z
        .array(z.number())
        .min(1)
        .describe("候选 AI 模板 id 列表（用户指定或由上游给出），前端据此拉详情渲染候选卡片供用户选择")
    }),
    resume: z.object({
      applied: z.boolean().describe("用户是否完成应用"),
      templateId: z.number().optional().describe("用户最终选择并应用的模板 id"),
      describePath: z
        .string()
        .optional()
        .describe(
          "应用后已同步的范式描述文件 workspace 相对路径（template-{screenId}.json，含新组件 id），供主 agent 读取后继续按需求修改"
        ),
      canceled: z.boolean().optional().describe("用户主动取消时为 true")
    })
  },

  [SuspendType.GroupComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.GroupComponent),
      componentIds: z.array(z.string()).min(2).describe("要组合成一个分组的组件 id 数组（需当前处于同一父级下）")
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准组合操作"),
      /** 分组容器和普通组件一样要业务接口分配真实 id，所以只能由前端建好回传 */
      component: componentCreatedFromFrontend,
      error: z.string().optional().describe("前端组合失败时的错误信息")
    })
  },
  [SuspendType.AskApprovalGroupComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalGroupComponent),
      purpose: z.string(),
      componentIds: z.array(z.string()).min(2)
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准组合操作"),
      component: componentCreatedFromFrontend,
      error: z.string().optional().describe("前端组合失败时的错误信息")
    })
  },

  [SuspendType.UngroupComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.UngroupComponent),
      groupIds: z.array(z.string()).min(1).describe("要解散的分组组件 id 数组")
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准解散操作"),
      ungrouped: frontendApplied("解散分组"),
      error: z.string().optional().describe("前端解散失败时的错误信息")
    })
  },
  [SuspendType.AskApprovalUngroupComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalUngroupComponent),
      purpose: z.string(),
      groupIds: z.array(z.string()).min(1)
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准解散操作"),
      ungrouped: frontendApplied("解散分组"),
      error: z.string().optional().describe("前端解散失败时的错误信息")
    })
  },

  [SuspendType.MoveComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.MoveComponent),
      componentIds: z.array(z.string()).min(1).describe("要移动的组件 id 数组"),
      target: z
        .object({
          parentId: z.number(),
          parentType: z.enum(["group", "dynamicPanel"]),
          stateId: z.string().optional()
        })
        .optional()
        .describe("不传表示移动到大屏根级")
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准移动操作"),
      moved: frontendApplied("移动组件"),
      error: z.string().optional().describe("前端移动失败时的错误信息")
    })
  },
  [SuspendType.AskApprovalMoveComponent]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalMoveComponent),
      purpose: z.string(),
      componentIds: z.array(z.string()).min(1),
      target: z
        .object({
          parentId: z.number(),
          parentType: z.enum(["group", "dynamicPanel"]),
          stateId: z.string().optional()
        })
        .optional()
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准移动操作"),
      moved: frontendApplied("移动组件"),
      error: z.string().optional().describe("前端移动失败时的错误信息")
    })
  },

  [SuspendType.AddPanelState]: {
    suspend: z.object({
      type: z.literal(SuspendType.AddPanelState),
      panelId: z.string().describe("动态面板组件 id"),
      stateName: z.string().describe("新状态的名称")
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准新增状态操作"),
      state: panelStateCreatedFromFrontend,
      error: z.string().optional().describe("前端新增状态失败时的错误信息")
    })
  },
  [SuspendType.AskApprovalAddPanelState]: {
    suspend: z.object({
      type: z.literal(SuspendType.AskApprovalAddPanelState),
      purpose: z.string(),
      panelId: z.string(),
      stateName: z.string()
    }),
    resume: z.object({
      approved: z.boolean().optional().describe("用户是否批准新增状态操作"),
      state: panelStateCreatedFromFrontend,
      error: z.string().optional().describe("前端新增状态失败时的错误信息")
    })
  }
} as const;

/**
 * 按 suspend type 提取对应的 suspend payload 类型。
 * @example SuspendPayload<SuspendType.CreateComponent>
 */
export type SuspendPayload<T extends SuspendType> = z.infer<(typeof SuspendDefs)[T]["suspend"]>;

/**
 * 按 suspend type 提取对应的 resume data 类型。
 * @example ResumeData<SuspendType.CreateComponent>
 */
export type ResumeData<T extends SuspendType> = z.infer<(typeof SuspendDefs)[T]["resume"]>;
