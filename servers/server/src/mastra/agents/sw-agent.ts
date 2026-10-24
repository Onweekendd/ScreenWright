import { Agent, type SubAgent } from "@mastra/core/agent";
import { TokenLimiter, ToolSearchProcessor } from "@mastra/core/processors";
import type { RequestContext } from "@mastra/core/request-context";
import type { Tool } from "@mastra/core/tools";
import type { DynamicArgument } from "@mastra/core/types";

import { loadPrompt } from "@/agent-resources/prompts";

import { CompactionProcessor } from "../lib/compaction/processors/compaction";
import { ToolResultCleanupProcessor } from "../lib/compaction/processors/toolResultCleanup";
import { InlineBackgroundTaskResults } from "../processors/inlineBackgroundTaskResults";
import { keepBgDelegationsVisible } from "../processors/keepBgDelegationsVisible";
import { ModeGuardProcessor } from "../processors/mode-guard.processor";
import { ToolCallArgsSanitizer } from "../processors/tool-call-args-sanitizer.processor";
import { resolveReasoningModel } from "../provider/model-registry";
import { memory } from "../storage/storage";
import { addPanelStateTool } from "../tools/add-panel-state";
import { applyAiTemplateTool } from "../tools/apply-ai-template";
import type { createDelegateAppCodeTool } from "../tools/artifact-app";
import { askUserQuestionTool } from "../tools/ask-user-question";
import { captureCanvasTool } from "../tools/capture-canvas";
import { configureCallbackArgs } from "../tools/configure-callback-args";
import { configureComponentData } from "../tools/configure-component-data";
import { copyComponentTool } from "../tools/copy-component";
import { createActionTemplate } from "../tools/create-action-template";
import { createConditionTemplate } from "../tools/create-condition-template";
import { createEchartOptionTool } from "../tools/create-echart-option";
import { createEventTemplate } from "../tools/create-event-template";
import { createImageTool } from "../tools/create-image";
import { createVideoTool } from "../tools/create-video";
import { executeInBrowserTool } from "../tools/execute-in-browser";
import { createComponentTool, createDataFilterTool, deleteFileTool, editFilesTool, readFileTool } from "../tools/file";
import { groupComponentTool } from "../tools/group-component";
import { listAvailableActions } from "../tools/list-available-actions";
import { listAvailableEvents } from "../tools/list-available-events";
import { moveComponentTool } from "../tools/move-component";
import { enterPlanModeTool, submitPlanTool } from "../tools/plan";
import { pullAssetsTool } from "../tools/pull-assets";
import { pushAssetsTool } from "../tools/push-assets";
import { saveAiTemplateTool } from "../tools/save-ai-template";
import { searchComponentTool } from "../tools/search-component-tool";
import { importMediaAssetsTool, searchMediaAssetsTool } from "../tools/search-media-assets";
import { simulateEvent } from "../tools/simulate-event";
import { claimTask, createTask, deleteTask, getTask, listTasks, resetTaskList, updateTask } from "../tools/task";
import { todoWrite } from "../tools/todo";
import { ungroupComponentTool } from "../tools/ungroup-component";
import { AgentMode, type CommonRunTimeType } from "../types/bi-chat";
import { figmaToBIV2Workflow } from "../workflows/figma-to-bi/figma-to-bi-v2-workflow";
import { fullWorkspace } from "../workspace";
import { dataFlowVerificationAgent } from "./data-flow-verification-agent";
import { swExecutorAgent } from "./sw-executor-agent";
import { templateExtractorAgent } from "./template-extractor-agent";

const baselineInstructions = [
  loadPrompt("mastra/sw-agent-core.md"),
  // BI 领域基本功。主 agent 此前一份领域提示词都没有，全靠开场几次 skill 检索现学——
  // 实测一条数据联动任务读进 39KB skill 内容（比整个系统提示词还大）、花掉 9 个纯检索
  // step / 95s，而其中绝大部分是每条任务都一样的固定流程。固定的进提示词，
  // 通用组件结构常驻；各类型专属 option/data schema、排错细则留在 skill 里按需读。
  loadPrompt("mastra/sw-domain-core.md"),
  loadPrompt("mastra/component-schema-core.md"),
  loadPrompt("mastra/tool-registry.md"),
  loadPrompt("mastra/editor-context.md"),
  loadPrompt("mastra/workspace-guide.md"),
  loadPrompt("mastra/task-management-core.md"),
  loadPrompt("mastra/artifact-app-workflow.md"),
  loadPrompt("mastra/screen-build-workflow.md"),
  loadPrompt("mastra/image-to-component-workflow.md"),
  loadPrompt("mastra/effect-image-workflow.md"),
  loadPrompt("mastra/runtime-query.md")
].join("\n\n");

// 压缩实验只替换主提示词，工具、模型和模式约束保持一致，便于与基线对照。
// 默认保留基线；BI_PROMPT_VARIANT=compact 时合并重复规则并统一换行。
const baseInstructions =
  process.env.BI_PROMPT_VARIANT === "compact"
    ? [
        loadPrompt("mastra/sw-agent-compact.md"),
        loadPrompt("mastra/sw-domain-core.md"),
        loadPrompt("mastra/component-schema-core.md")
      ]
        .join("\n\n")
        .replace(/\r\n/g, "\n")
    : baselineInstructions;

const planModePrompt = loadPrompt("mastra/mode-plan.md");

export interface CreateSwAgentOptions {
  /** 已由启动层注入 ArtifactAppService 的前端编码任务委派工具。 */
  readonly delegateAppCodeTool: ReturnType<typeof createDelegateAppCodeTool>;
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
      createImageTool,
      createVideoTool,
      searchMediaAssetsTool,
      importMediaAssetsTool,
      // 本地处理素材的两头：拉到工作区 assets/ 才能用 execute_command 处理，处理完传回素材库。
      // 单个调用带多个文件、内部并行；agent 一想「本地处理图片」就要用到，跟生图工具一起常驻
      pullAssetsTool,
      pushAssetsTool,
      // 任务管理：委派通信的核心通道，必须每轮规划都可用，不走动态搜索
      createTask,
      updateTask,
      getTask,
      listTasks,
      delegateAppCodeTool,
      // 视觉自检：主模型自己能看图后，搭完/改完截一张画布对照用户给的参考图，
      // 跟 simulateEvent 一样属于收尾必走的一步，常驻
      captureCanvasTool,
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
          // 生图：低频（一次会话顶多用到几次装饰素材/效果图），且本身开了 background，
          // 常驻只会白占每轮的 schema token。工具内部已经幂等（promptHash），检索没命中
          // 漏用一次的代价也就是让 agent 退回文字描述，不影响正确性
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
      new ToolCallArgsSanitizer(),
      new keepBgDelegationsVisible(),
      // 后台任务完成后的续接提示只有任务 id，没有结果：在这里把结果写进提示里
      new InlineBackgroundTaskResults(),
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
      figmaToBIV2Workflow
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
