import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { CloudExporter, DefaultExporter, Observability, SensitiveDataFilter } from "@mastra/observability";

import { swAgent } from "./runtime";
import { storage } from "./storage/storage";
import { codiaToBIWorkflow } from "./workflows/figma-to-bi/codia-to-bi-workflow";
import { figmaToBIV2Workflow } from "./workflows/figma-to-bi/figma-to-bi-v2-workflow";
import { requirementToBIWorkflow } from "./workflows/requirement-to-bi/requirement-to-bi-workflow";
import { workspace } from "./workspace";

export const mastra = new Mastra({
  agents: {
    swAgent
  },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  workflows: { figmaToBIV2Workflow, codiaToBIWorkflow, requirementToBIWorkflow },
  storage,
  // 后台任务：让耗时的子 agent 委派(swExecutorAgent)不阻塞 agentic loop。
  // 需要 storage(已配置)。具体哪些工具走后台在 swAgent.backgroundTasks.tools 里 opt-in。
  backgroundTasks: {
    enabled: true,
    globalConcurrency: 10,
    perAgentConcurrency: 5,
    backpressure: "queue",
    defaultTimeoutMs: 600_000,
    // post-flush 安全触发点：onResult 已在此回调前 await 刷好 memory，
    // 让主 agent 读 memory 把后台任务结论续接进同一条会话流（runTurn 串行队列保证顺序）。
    onTaskComplete: (task) => {
      console.log("[bg-task] complete", task.id, task.toolName);
      // if (task.threadId) {
      //   void sessionRegistry.find(task.threadId)?.runTurn({ messages: [] });
      // }
    },
    onTaskFailed: (task) => {
      console.error(
        "[bg-task] failed",
        task.id,
        task.error,
        "cause:",
        (task.error as unknown as { cause?: unknown })?.cause
      );
      // data-background-task-failed chunk 已由 attachTaskStream 推进 outer 流，前端子流可展示失败。
      // 此处不触发 runTurn——无上下文地让 agent 重跑只会导致无限重试循环（agent 读 memory
      // 发现任务失败 → 再次委派 → 再失败 → 死循环，前端看到同样内容重复出现）。
      // 如需 agent 向用户说明失败，等 Issue-1（bg task resume 失败）修复后再评估是否要续接 turn。
    }
  },
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [new DefaultExporter(), new CloudExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()]
      }
    }
  }),
  workspace
});
