import type { MastraDBMessage } from "@mastra/core/agent";
import { Agent, type SubAgent } from "@mastra/core/agent";
import {
  type Processor,
  type ProcessorMessageContext,
  TokenLimiter,
  ToolSearchProcessor
} from "@mastra/core/processors";
import type { RequestContext } from "@mastra/core/request-context";
import type { Tool } from "@mastra/core/tools";
import type { DynamicArgument } from "@mastra/core/types";

import { loadPrompt } from "@/agent-resources/prompts";

import { CompactionProcessor } from "../lib/compaction/processors/compaction";
import { ToolResultCleanupProcessor } from "../lib/compaction/processors/toolResultCleanup";
import { keepBgDelegationsVisible } from "../processors/keepBgDelegationsVisible";
import { ModeGuardProcessor } from "../processors/mode-guard.processor";
import { rewriteSuspendedContinuationDirective } from "../processors/rewriteSuspendedContinuationDirective";
import { ToolCallArgsSanitizer } from "../processors/tool-call-args-sanitizer.processor";
import { resolveReasoningModel } from "../provider/model-registry";
import { memory } from "../storage/storage";
import { addPanelStateTool } from "../tools/add-panel-state";
import { analyzeImageTool } from "../tools/analyze-image";
import { applyAiTemplateTool } from "../tools/apply-ai-template";
import type { createDelegateAppCodeTool } from "../tools/artifact-app";
import { askUserQuestionTool } from "../tools/ask-user-question";
import { configureCallbackArgs } from "../tools/configure-callback-args";
import { configureComponentData } from "../tools/configure-component-data";
import { copyComponentTool } from "../tools/copy-component";
import { createActionTemplate } from "../tools/create-action-template";
import { createConditionTemplate } from "../tools/create-condition-template";
import { createEchartOptionTool } from "../tools/create-echart-option";
import { createEventTemplate } from "../tools/create-event-template";
import { executeInBrowserTool } from "../tools/execute-in-browser";
import { createComponentTool, createDataFilterTool, deleteFileTool, editFilesTool, readFileTool } from "../tools/file";
import { groupComponentTool } from "../tools/group-component";
import { listAvailableActions } from "../tools/list-available-actions";
import { listAvailableEvents } from "../tools/list-available-events";
import { moveComponentTool } from "../tools/move-component";
import { enterPlanModeTool, submitPlanTool } from "../tools/plan";
import { saveAiTemplateTool } from "../tools/save-ai-template";
import { searchComponentTool } from "../tools/search-component-tool";
import { simulateEvent } from "../tools/simulate-event";
import { claimTask, createTask, deleteTask, getTask, listTasks, resetTaskList, updateTask } from "../tools/task";
import { todoWrite } from "../tools/todo";
import { ungroupComponentTool } from "../tools/ungroup-component";
import { AgentMode, type CommonRunTimeType } from "../types/bi-chat";
import { codiaToBIWorkflow } from "../workflows/figma-to-bi/codia-to-bi-workflow";
import { figmaToBIV2Workflow } from "../workflows/figma-to-bi/figma-to-bi-v2-workflow";
import { requirementToBIWorkflow } from "../workflows/requirement-to-bi/requirement-to-bi-workflow";
import { fullWorkspace } from "../workspace";
import { dataFlowVerificationAgent } from "./data-flow-verification-agent";
import { swExecutorAgent } from "./sw-executor-agent";
import { templateExtractorAgent } from "./template-extractor-agent";

const baselineInstructions = [
  loadPrompt("mastra/sw-agent-core.md"),
  // BI 领域基本功。主 agent 此前一份领域提示词都没有，全靠开场几次 skill 检索现学——
  // 实测一条数据联动任务读进 39KB skill 内容（比整个系统提示词还大）、花掉 9 个纯检索
  // step / 95s，而其中绝大部分是每条任务都一样的固定流程。固定的进提示词，
  // 查询性的（组件 schema、排错细则）留在 skill 里按需读。
  loadPrompt("mastra/sw-domain-core.md"),
  loadPrompt("mastra/tool-registry.md"),
  loadPrompt("mastra/editor-context.md"),
  loadPrompt("mastra/file-tools.md"),
  loadPrompt("mastra/workspace-structure.md"),
  loadPrompt("mastra/task-prompts.md"),
  loadPrompt("mastra/artifact-app-workflow.md"),
  loadPrompt("mastra/todo-prompts.md"),
  loadPrompt("mastra/screen-build-workflow.md"),
  loadPrompt("mastra/image-to-component-workflow.md"),
  loadPrompt("mastra/data-states.md"),
  loadPrompt("mastra/browser-sdk.md")
].join("\n\n");

// 压缩实验只替换主提示词，工具、模型和模式约束保持一致，便于与基线对照。
// 默认保留基线；BI_PROMPT_VARIANT=compact 时合并重复规则并统一换行。
const baseInstructions =
  process.env.BI_PROMPT_VARIANT === "compact"
    ? [loadPrompt("mastra/sw-agent-compact.md"), loadPrompt("mastra/sw-domain-core.md")]
        .join("\n\n")
        .replace(/\r\n/g, "\n")
    : baselineInstructions;

const planModePrompt = loadPrompt("mastra/mode-plan.md");

export interface CreateSwAgentOptions {
  /** 已由启动层注入 ArtifactAppService 的前端编码任务委派工具。 */
  readonly delegateAppCodeTool: ReturnType<typeof createDelegateAppCodeTool>;
}

// ============ ImagePartSanitizer 辅助类型与纯函数 ============

const IMAGE_MIME_PREFIX = "image/";

interface FilePartShape {
  type: string;
  mimeType?: string;
  mediaType?: string;
  data?: string;
  url?: string;
  filename?: string;
  name?: string;
}

interface ExperimentalAttachment {
  url?: string;
  contentType?: string;
  name?: string;
}

interface UserMessageContent {
  parts?: unknown[];
  experimental_attachments?: ExperimentalAttachment[];
}

interface TextOrOtherPart {
  type: string;
  text?: string;
}

interface ImageEntry {
  url: string;
  filename?: string;
}

const hasImageMime = (mime: string | undefined): boolean =>
  typeof mime === "string" && mime.startsWith(IMAGE_MIME_PREFIX);

const isImagePart = (p: unknown): p is FilePartShape => {
  const x = p as FilePartShape | null | undefined;
  return x?.type === "file" && hasImageMime(x.mimeType ?? x.mediaType);
};

const isImageAttachment = (a: ExperimentalAttachment | null | undefined): boolean => hasImageMime(a?.contentType);

/**
 * 收集图片条目并按 URL 去重——Mastra 会把同一张图同时写进 parts 和 experimental_attachments，
 * 不去重的话生成的 hint 文本会出现重复 <image>，导致模型误以为收到了多张图。
 */
const collectImageEntries = (content: UserMessageContent | undefined): ImageEntry[] => {
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const attachments = Array.isArray(content?.experimental_attachments) ? content.experimental_attachments : [];

  const fromParts: ImageEntry[] = parts
    .filter(isImagePart)
    .map((p) => ({ url: p.url ?? p.data ?? "", filename: p.filename ?? p.name }));
  const fromAttachments: ImageEntry[] = attachments
    .filter(isImageAttachment)
    .map((a) => ({ url: a.url ?? "", filename: a.name }));

  const seen = new Set<string>();
  const deduped: ImageEntry[] = [];
  for (const entry of [...fromParts, ...fromAttachments]) {
    if (!entry.url || seen.has(entry.url)) {
      continue;
    }
    seen.add(entry.url);
    deduped.push(entry);
  }
  return deduped;
};

const buildImageHint = (entries: ImageEntry[]): string => {
  if (entries.length === 0) {
    return "";
  }
  const items = entries
    .map((e, i) => `  <image index="${i + 1}" url="${e.url}"${e.filename ? ` filename="${e.filename}"` : ""} />`)
    .join("\n");
  return `\n\n<attached-images>\n${items}\n</attached-images>`;
};

/** 剥除 file part 并把 hint 文本合并进首个 text part；若无 text part 则前插一个。 */
const stripFilePartsAndAttachHint = (parts: unknown[] | undefined, hint: string): TextOrOtherPart[] => {
  const baseParts = (Array.isArray(parts) ? (parts as TextOrOtherPart[]) : []).filter((p) => p.type !== "file");
  const merged = baseParts.map((p, i) => (i === 0 && p.type === "text" ? { ...p, text: (p.text ?? "") + hint } : p));
  if (hint && !merged.some((p) => p.type === "text")) {
    merged.unshift({ type: "text", text: hint.trim() });
  }
  return merged;
};

/** 返回 undefined 表示该字段应整体删除（原数组里只有图片）。 */
const stripImageAttachments = (
  attachments: ExperimentalAttachment[] | undefined
): ExperimentalAttachment[] | undefined => {
  if (!Array.isArray(attachments)) {
    return attachments;
  }
  const remaining = attachments.filter((a) => !isImageAttachment(a));
  return remaining.length === 0 ? undefined : remaining;
};

/**
 * 将用户消息中的图片 file part 转换为文本提示，移除 file part 本身。
 * DeepSeek 不具备视觉能力，收到 image content part 时 aihubmix 会挂起。
 * 图片 URL 以文本形式保留，供 agent 决策是否调用 analyze_image 工具。
 *
 * 注意：MastraDBMessage 把图片同时存在 content.parts 和 content.experimental_attachments
 * 两处。只清 parts 不行——Mastra DB→UI 还原时会从 experimental_attachments 把 file part
 * 再加回来（见 @mastra/core chunk-JGZLU7MM.js:828-838），所以这里两个字段都要清。
 * 字段命名 mimeType/data 兼容 mediaType/url，以应对适配层未来变动。
 */
class ImagePartSanitizer implements Processor {
  id = "image-part-sanitizer";

  async processInput({ messages }: ProcessorMessageContext): Promise<MastraDBMessage[]> {
    return messages.map((msg) => {
      if (msg.role !== "user") {
        return msg;
      }

      const content = msg.content as UserMessageContent | undefined;
      const entries = collectImageEntries(content);
      if (entries.length === 0) {
        return msg;
      }

      const hint = buildImageHint(entries);
      const newParts = stripFilePartsAndAttachHint(content?.parts, hint);
      const newAttachments = stripImageAttachments(content?.experimental_attachments);

      const newContent: Record<string, unknown> = { ...content, parts: newParts };
      if (newAttachments === undefined) {
        delete newContent.experimental_attachments;
      } else {
        newContent.experimental_attachments = newAttachments;
      }

      return { ...msg, content: newContent } as MastraDBMessage;
    });
  }
}

/**
 * BI-Agent
 * 用于处理BI任务的主入口
 */
export function createSwAgent(options: CreateSwAgentOptions) {
  const { delegateAppCodeTool } = options;

  return new Agent({
    id: "sw-agent",
    name: "BI-Agent",
    description: "A sw-agent that can perform both text and image classification tasks.",

    instructions: ({ requestContext }: { requestContext: RequestContext<CommonRunTimeType> }) => {
      const mode = requestContext?.get("mode") ?? AgentMode.ASK_BEFORE_EDIT;
      const extra = mode === AgentMode.PLAN ? planModePrompt : "";
      return [baseInstructions, extra].filter(Boolean).join("\n\n");
    },

    // 模型配置在 ai_model 表（前端「设置」页），每次 run 重新解析以支持热更新
    model: () => resolveReasoningModel(),

    memory,

    // 主 agent 与子 agent 共用 fullWorkspace（含 references）。
    // 主 agent 既能直接写也能委派：
    // - 直接写路径下需要按需 `skill_read` 读 references 拿字段定义/约束
    // - 委派路径仍由 prompt 约束只看 SKILL.md 概览，把深读 references 留给子 agent
    workspace: fullWorkspace,

    // 主 agent 同时具备直接编辑能力与委派能力：
    // - 小规模任务（单文件改动 / 单组件改动 / 简单 bug 修复 / 子 agent 失败后接力补救）直接调用写工具
    // - 大规模并发场景（多 slot 大屏构建）走 ask_swExecutorAgent 委派
    // PLAN 模式下写工具会被 ModeGuardProcessor 自动剥离，仅保留只读 + 规划工具
    // 常驻工具只留每轮都可能用到的。低频的一律走 ToolSearchProcessor 动态注入——
    // 每个常驻工具的 schema 每一轮都要重发一遍，实测 44 个工具的 tools 段占单次请求
    // prompt 的六成，挪走的那批合计约 9.5k token/轮。
    tools: {
      // 只读探查
      searchComponentTool,
      readFileTool,
      // 写：组件 / 文件——建和改是主路径，每轮都可能用
      createComponentTool,
      editFilesTool,
      deleteFileTool,
      // 用户交互 / 待办
      askUserQuestionTool,

      // 数据联动三件套：曾经走动态注入，实测证明该常驻。
      // 109 个 eval 线程里 createEventTemplate 命中 16 个线程、listAvailableEvents 16 个、
      // createDataFilterTool 17 个——是动态名单里出现频次最高的三个，且往往在同一条任务里
      // 前后脚出现（配事件 → 查组件支持的 trigger → 建过滤器）。
      //
      // 代价对比是压倒性的：常驻的成本是每轮多发一份 schema，而它落在**稳定前缀**里，
      // 实测缓存命中约 85%，边际成本约一成；动态注入的成本是 search_tools 一个来回，
      // 外加工具集一变就把整段前缀作废——b4 里一次 load_tool 让 cached 从 57k 掉到 22k，
      // 单这一步就多烧 35k 未缓存 token，比常驻一整轮还贵。
      createEventTemplate,
      listAvailableEvents,
      createDataFilterTool,
      configureCallbackArgs,
      // 与上面三个同理：接数据是「接入七步」的第一步，跟建过滤器、配 cbArgs 前后脚出现。
      // 它还兼着「字段清单从哪来」的职责——不常驻的话 agent 会退回老路：满目录 grep 找
      // 请求字段名、编接口路径、编响应字段名（b8 实测三者都出现过）
      configureComponentData,
      // 自检：配完事件/数据流后干跑一遍。曾是命令行脚本，agent 调一次要 7 步（摸 shell、读源码、
      // 跟 cmd.exe 的引号转义搏斗）；常驻成工具后一次调用
      simulateEvent,

      // 任务管理：委派通信的核心通道，必须每轮规划都可用，不走动态搜索
      createTask,
      updateTask,
      getTask,
      listTasks,
      delegateAppCodeTool,
      analyzeImageTool,
      todoWrite,
      enterPlanModeTool,
      submitPlanTool
    },

    inputProcessors: [
      new ToolSearchProcessor({
        tools: {
          // claimTask 主 agent 不直接用（认领由子 agent 完成）；保留入口以备规划阶段查询任务状态
          claimTask,
          deleteTask,
          resetTaskList,
          // 配置事件 / 条件 / 行为模板：主 agent 在直接处理小规模事件配置时按需注入
          createConditionTemplate,
          createActionTemplate,
          // 组件能力查询（只读）：主 agent 直接写事件配置前查目标组件支持哪些 action
          listAvailableActions,
          // echart 通用组件兜底：仅在确认是图表且专用可配置组件无法满足时，主 agent 才据 description
          // 自行编写 echart option 并用本工具落地文件（配合 execute_command 跑 tsc 自校验）。属低频场景，走动态检索
          createEchartOptionTool,
          // 计划维护工具（createPlanTool / editPlanTool）改由 ModeGuardProcessor 在 PLAN 模式下
          // 确定性注入，不再走语义检索，避免漏召回导致 agent 用 execute_command 代替写计划

          // ↓ 以下原为常驻，因单轮 token 开销过大改为动态注入。都属于「有明确触发语境」的操作：
          // 用户说到复制/分组/移动/加状态时才需要，检索命中率高。实测（109 个 eval 线程）
          // 各自只出现在 5~7 个线程里，留在这儿是对的。
          copyComponentTool,
          groupComponentTool,
          ungroupComponentTool,
          moveComponentTool,
          addPanelStateTool,
          // 浏览器执行：只在需要跑前端侧脚本时用
          executeInBrowserTool,
          // 模板存取：模板提取收尾 / 模板检索命中后应用，都是明确的收尾动作
          saveAiTemplateTool,
          applyAiTemplateTool
          // ToolSearchProcessor 的 tools 签名是 `Record<string, Tool<any, any>>`——只给了两个
          // 类型参数，第 3/4 个（suspendSchema / resumeSchema）默认成 unknown，于是所有带 suspend
          // 的工具都不兼容。这是签名太窄而非运行时限制（挂起发生在 execute 内部，与工具怎么进入
          // 本轮列表无关），所以这里断言掉。mastra 放宽签名后可以拿掉。
        } as unknown as Record<string, Tool<any, any>>,
        search: {
          topK: 5,
          minScore: 0.1,
          // 命中的工具直接生效，省掉 search_tools → load_tool 那一趟额外往返
          // （`agent-BOdDHE12.cjs:14937` 默认 false；开启后的提示语见 `:15137`）。
          // 实测 109 个线程里 load_tool 被调了 73 次、覆盖 59 个线程——超过半数对话要为
          // 「找到了但还没装上」多付一个来回，而这一步纯属协议开销，不产生任何判断。
          autoLoad: true
        }
      }),
      new ImagePartSanitizer(),
      new ToolCallArgsSanitizer(),
      new keepBgDelegationsVisible(),
      new rewriteSuspendedContinuationDirective(),
      // 必须放在 ToolSearchProcessor 之后,以便剥离 Search 动态注入的写工具(如 createConditionTemplate)
      new ModeGuardProcessor(),
      new ToolResultCleanupProcessor(),
      new CompactionProcessor(),
      new TokenLimiter(300_000)
    ],

    defaultOptions: {
      maxSteps: 20,
      delegation: {
        // 子 agent 不需要看主 agent 跟用户的对话历史。
        //
        // Mastra 把 `prompt` 自动构造成一条 user 消息发给子 agent(@mastra/core 内部:
        // `messagesForSubAgent = [{ role: "user", content: effectivePrompt }]`),
        // messageFilter 返回的 messages 是**额外的 context**,默认行为是把主 agent 的全部对话
        // 都塞进子 agent 的 context —— 长会话时这部分会爆。
        //
        // 我们这边委派 prompt 已经包含 task_list_id + pending_task_ids,子 agent 通过这两个 ID
        // 从 task 系统拿完整上下文,不需要任何父对话历史。返回 [] 把这部分整个砍掉。
        messageFilter: (context) => {
          const { messages, primitiveId } = context;

          if (
            primitiveId === "sw-executor-agent" ||
            primitiveId === "data-flow-verification-agent" ||
            primitiveId === "template-extractor-agent"
          ) {
            return [];
          }
          return messages;
        }
      }
    },

    // 始终暴露两个子 agent，不在此处按 mode 门控：
    // 子 agent 的委派工具（agent-swExecutorAgent）由 ModeGuard 在 PLAN 模式下逐步剥离，
    // 而 agents 解析在每个 run 只跑一次（run 起点），无法随 run 内的 mode 切换把它加回来。
    // 把管控统一落到工具层，才能让"批准计划后同 run 立即恢复委派能力"生效。
    // dataFlowVerificationAgent 只读校验，任何模式都可用。
    agents: {
      dataFlowVerificationAgent,
      swExecutorAgent,
      templateExtractorAgent
    } as unknown as DynamicArgument<Record<string, SubAgent<string, CommonRunTimeType>>, CommonRunTimeType>,

    workflows: {
      figmaToBIV2Workflow,
      // 图片转大屏正式路：入参图片 MinIO URL → Codia image_to_design → 同一转换 pipeline。
      codiaToBIWorkflow,
      // 从零构建：没有设计稿、纯文字需求时走它。入参是**已与用户确认过的内容清单**，
      // 需求收敛与确认留在对话层做（见该工作流的头注释）。
      requirementToBIWorkflow
    },

    // 后台任务 opt-in：最小可用版本只把大屏并发施工子 agent 放后台。
    // 子 agent 调用底层是工具调用，key 用子 agent 名。
    // figmaToBIV2Workflow 暂不放后台——其进度依赖 data-tool-workflow chunk，进后台会改走
    // background-task-* chunk 导致现有进度统计失效，后续再单独适配。
    backgroundTasks: {
      tools: {
        swExecutorAgent: { enabled: true, timeoutMs: 900_000 }
      }
    }
  });
}
