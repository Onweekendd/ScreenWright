import { Agent } from "@mastra/core/agent";
import { ToolSearchProcessor } from "@mastra/core/processors";

import { loadPrompt } from "@/agent-resources/prompts";

import { ToolCallArgsSanitizer } from "../processors/tool-call-args-sanitizer.processor";
import { resolveReasoningModel } from "../provider/model-registry";
import { memory } from "../storage/storage";
import { configureCallbackArgs } from "../tools/configure-callback-args";
import { configureComponentData } from "../tools/configure-component-data";
import { copyComponentTool } from "../tools/copy-component";
import { createActionTemplate } from "../tools/create-action-template";
import { createConditionTemplate } from "../tools/create-condition-template";
import { createEventTemplate } from "../tools/create-event-template";
import { createComponentTool, createDataFilterTool, deleteFileTool, editFilesTool, readFileTool } from "../tools/file";
import { listAvailableActions } from "../tools/list-available-actions";
import { listAvailableEvents } from "../tools/list-available-events";
import { searchComponentTool } from "../tools/search-component-tool";
import { simulateEvent } from "../tools/simulate-event";
import { claimTask, getTask, listTasks, updateTask } from "../tools/task";
import { fullWorkspace } from "../workspace";

const instructions = [
  loadPrompt("mastra/sw-executor-core.md"),
  loadPrompt("mastra/workspace-structure.md"),
  loadPrompt("mastra/file-tools.md"),
  loadPrompt("mastra/component-operator.md"),
  // 领域基本功常驻。取代了原来的 event-interaction.md / data-binding.md——那两份的全部内容
  // 就是「去调 skill 读工作流」，等于把每条任务的开场都换成几次检索往返。
  loadPrompt("mastra/sw-domain-core.md"),
  loadPrompt("mastra/task-prompts.md")
].join("\n\n");

export const swExecutorAgent = new Agent({
  id: "sw-executor-agent",
  name: "BI 执行 Agent",
  description:
    "【施工入口】所有写操作必须经此委派——创建组件 / 编辑文件 / 推送组件 / 复制组件 / 删除文件 / 配置事件模板 / 创建数据过滤器 / 创建条件或行为模板。" +
    "调用前置条件：主 agent 必须先用 create_task 创建一个或多个 pending 任务，metadata 含 task_kind + screenId；task_kind='create' 时只需 user_intent，task_kind='modify' 时需 target_files / expected_state / context / skill_ref。" +
    "入参 XML 仅需 <task_list_id> 与 <pending_task_ids>；上下文一律从 task.metadata 读取，不从调用参数读。" +
    "对 task_kind='create' 的任务，子 agent 会自己读 skill / search_component / 决定 prop 名，无需主 agent 预先研究。" +
    "返回 <execution_report> 摘要；如有 verification_required 任务，主 agent 接力调 ask_dataFlowVerificationAgent。" +
    "不会反向追问，也不会调用校验类子 agent。",

  instructions,

  model: () => resolveReasoningModel(),

  memory,

  // 执行类 agent：需要完整 skill 权限（common + executor），才能读 sw-component-schema 等实现细节
  workspace: fullWorkspace,

  tools: {
    searchComponentTool,
    // 读：写之前必须能看到当前状态
    readFileTool,
    // 写：组件 / 文件 / 事件 / 过滤器
    createComponentTool,
    copyComponentTool,
    editFilesTool,
    deleteFileTool,
    createDataFilterTool,
    createEventTemplate,
    configureCallbackArgs,
    configureComponentData,
    simulateEvent,
    // 与 createEventTemplate 前后脚出现（配事件前先查目标组件支持哪些 trigger），
    // 一起常驻才有意义——只常驻其一，仍要为另一个走一趟检索
    listAvailableEvents,
    // 任务协调（核心通信通道）：必须静态挂载，每次调用都要用
    claimTask,
    updateTask,
    getTask,
    listTasks
  },

  inputProcessors: [
    new ToolSearchProcessor({
      tools: {
        createConditionTemplate,
        createActionTemplate,
        // 组件能力查询（只读）：配置事件前查目标组件支持哪些 action
        listAvailableActions
      },
      search: {
        topK: 5,
        minScore: 0.1,
        // 与主 agent 同口径：命中即生效，省掉 load_tool 那趟往返（成因见 sw-agent.ts 同名选项）
        autoLoad: true
      }
    }),
    new ToolCallArgsSanitizer()
  ],

  defaultOptions: {
    maxSteps: 30
  }
});
