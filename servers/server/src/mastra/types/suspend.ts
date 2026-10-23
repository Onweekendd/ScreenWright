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
  /** AUTO 模式：直接在浏览器执行脚本 */
  ExecuteInBrowser = "execute_in_browser",
  /** ASK 模式：审批通过后在浏览器执行脚本 */
  AskApprovalExecuteInBrowser = "ask_approval_execute_in_browser",
  /** 截取当前编辑器画布，上传后回传图片 URL（只读，任何模式都不审批） */
  CaptureCanvas = "capture_canvas",
  /** 模板提取后：把解析出的模板字段交前端预填弹窗，由用户确认/修改后保存为 AI 模板 */
  SaveAiTemplate = "save_ai_template",
  /** 模板检索后：把候选模板 id 列表交前端弹窗（封面+适用场景），由用户选择并应用到当前大屏 */
  ApplyAiTemplate = "apply_ai_template",
  /**
   * 画布写操作的统一挂起：一批 `ops` 交前端依次执行，回执按下标一一对应。
   * 审批只在一处判断（可选的 `approval`），不再一种操作两个类型。
   */
  CanvasOps = "canvas_ops"
}

export const SuspendTypeSchema = z.enum(SuspendType);

/** 画布写操作里「挂到某个容器下」的目标：分组，或动态面板的某个状态 */
const containerTargetSchema = z.object({
  parentId: z.number(),
  parentType: z.enum(["group", "dynamicPanel"]),
  stateId: z.string().optional()
});

/** 新建 / 复制 / 删除时组件所在的容器；不传就是大屏根级 */
const placementSchema = containerTargetSchema.optional();

/**
 * `canvas_ops` 能向前端提出的全部画布写操作。
 *
 * **组件 id 在协议里一律是 `number`**：后端在组装 ops 时就把 `"5_1/114"` 这类带大屏前缀的入参解析成
 * 纯数字 id，没解析好编译不过——此前 move_component 把入参原样交给前端、`Number()` 成了 NaN。
 */
const CanvasOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("create_component"),
    component: z.record(z.string(), z.unknown()).describe("校验过的新组件模板；真实 id 由前端的业务接口分配"),
    placement: placementSchema
  }),
  z.object({
    op: z.literal("copy_component"),
    component: z.record(z.string(), z.unknown()).describe("源组件的完整配置（分组 / 动态面板带整棵子树）"),
    placement: placementSchema
  }),
  z.object({
    op: z.literal("delete_component"),
    componentId: z.number().describe("待删除的组件 id"),
    placement: placementSchema
  }),
  z.object({
    op: z.literal("update_component"),
    component: ComponentSchema.describe("后端过 core 之后那一份组件；前端按 merge 策略合并到画布上的同 id 实例")
  }),
  z.object({
    op: z.literal("save_filter"),
    filter: FilterSchema,
    originalName: z
      .string()
      .optional()
      .describe("编辑前的过滤器名；与 filter.name 不同即为改名，前端需先删旧名再保存，否则新旧并存")
  }),
  z.object({ op: z.literal("delete_filter"), filterName: z.string() }),
  z.object({
    op: z.literal("update_screen_info"),
    screenId: z.number(),
    detail: LargeScreenDetailInfoSchema,
    minioIds: z.array(z.union([z.number(), z.null()])).optional()
  }),
  z.object({
    op: z.literal("group_components"),
    componentIds: z.array(z.number()).min(2).describe("要组合成一个分组的组件 id（需当前处于同一父级下）")
  }),
  z.object({
    op: z.literal("ungroup"),
    groupIds: z.array(z.number()).min(1).describe("要解散的分组组件 id")
  }),
  z.object({
    op: z.literal("move_components"),
    componentIds: z.array(z.number()).min(1).describe("要移动的组件 id"),
    target: containerTargetSchema.optional().describe("不传表示移动到大屏根级")
  }),
  z.object({
    op: z.literal("add_panel_state"),
    panelId: z.number().describe("动态面板组件 id"),
    stateName: z.string().describe("新状态的名称")
  })
]);

export type CanvasOp = z.infer<typeof CanvasOpSchema>;

/**
 * 单个画布操作的回执。成功时带上**只有前端拿得到的产物**：
 * - `component`：前端建好的组件（含业务接口分配的真实 id）。真实 id 只有业务接口能分配，实例还要套组件菜单的
 *   默认值、跑一遍位置尺寸分配，落在画布上的那份跟后端发过去的不是同一个东西——后端拿着这一份过 core
 *   放进树、整屏落盘，路径由后端从自己的树推，工作区因此只有一个写入者；
 * - `state`：前端建好的动态面板状态。状态 id 是本地 uuid、后端自己也造得出来，但**画布上已经用这个 id 建好了**，
 *   后端再造一个就跟画布对不上。
 *
 * 不产生新 id 的操作（移动 / 解组）只回 `{ ok: true }`：摘挂与包围盒重算两边跑的是 core 里同一个函数，
 * 新路径由后端改完自己的树再扫盘推，不由前端拼。
 */
const OpResultSchema = z.union([
  z.object({
    ok: z.literal(true),
    component: z.record(z.string(), z.unknown()).optional(),
    state: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({ ok: z.literal(false), error: z.string() })
]);

export type OpResult = z.infer<typeof OpResultSchema>;

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

  [SuspendType.CaptureCanvas]: {
    suspend: z.object({
      type: z.literal(SuspendType.CaptureCanvas),
      componentIds: z.array(z.number()).optional().describe("只截这些组件的并集外框；不传截整个画布"),
      region: z
        .object({ x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive() })
        .optional()
        .describe(
          "只截画布上的这块矩形（设计稿像素，原点在画布左上角）；与 componentIds 二选一，超出画布的部分会被裁掉"
        ),
      grid: z.boolean().optional().describe("在截图上叠一层标了画布坐标的网格"),
      gridStep: z.number().positive().optional().describe("网格间距（设计稿像素），不传自动"),
      snap: z.boolean().optional().describe("只对 region 生效：四条边吸附到附近的边框线上")
    }),
    resume: z.object({
      ok: z.boolean(),
      url: z.string().optional().describe("截图上传后的访问 URL"),
      width: z.number().optional(),
      height: z.number().optional(),
      region: z
        .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
        .optional()
        .describe("截图在画布上实际覆盖的区域（设计稿像素，已按画布边界裁过）；整屏截图就是整块画布"),
      scale: z.number().optional().describe("每 1 设计稿像素对应的图片像素数"),
      gridStep: z.number().optional().describe("叠了网格时实际用的间距（设计稿像素），可能比请求的大"),
      snapped: z
        .object({ left: z.boolean(), top: z.boolean(), right: z.boolean(), bottom: z.boolean() })
        .optional()
        .describe("开了 snap 时每条边是否吸附到了边框线"),
      missingIds: z.array(z.number()).optional().describe("画布上找不到或当前不可见的组件 id"),
      error: z.string().optional()
    })
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

  [SuspendType.CanvasOps]: {
    suspend: z.object({
      type: z.literal(SuspendType.CanvasOps),
      approval: z
        .object({ purpose: z.string() })
        .optional()
        .describe("有它：前端先弹一次确认，整批一次；没有就直接执行"),
      ops: z.array(CanvasOpSchema).min(1).describe("按顺序执行的画布操作；回执 results[i] 对应 ops[i]"),
      ...batchOperationFields
    }),
    resume: z.union([
      z.object({ approved: z.literal(false), ...batchOperationFields }),
      z.object({
        results: z.array(OpResultSchema).describe("与 ops 等长，按下标一一对应；单项失败只记在自己那一项"),
        ...batchOperationFields
      })
    ])
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
