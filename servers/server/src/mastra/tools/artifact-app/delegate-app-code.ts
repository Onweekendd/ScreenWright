import { createTool } from "@mastra/core/tools";

import type { ArtifactAppService } from "@/artifact-app/application/artifact-app-service";
import { TaskIdentifierSchema } from "@/task-management";

export interface CreateDelegateAppCodeToolOptions {
  /** 由应用启动层创建并注入的 Artifact App 应用服务。 */
  readonly artifactAppService: Pick<ArtifactAppService, "executeCodeTask">;
}

/**
 * 创建 Mastra 到 Artifact App 的编码任务委派工具。
 *
 * 工具只传递任务列表 ID 和任务 ID。appId、开发指令与验收条件由
 * ArtifactAppService 从任务记录中读取并校验，Mastra 不重复传递这些字段。
 */
export function createDelegateAppCodeTool(options: CreateDelegateAppCodeToolOptions) {
  return createTool({
    id: "delegate-app-code",
    description: [
      "将已经创建的 Artifact App 前端编码任务委托给 Pi Agent 执行。",
      "只传入 create_task 返回的 taskListId 和 taskId；",
      "不要传入 appId、代码指令、验收条件、文件路径或 Sandbox 信息。",
      "工具会返回任务状态、执行摘要、修改文件、检查结果或结构化失败原因。"
    ].join(""),
    strict: true,
    inputSchema: TaskIdentifierSchema,
    execute: async (taskIdentifier) => options.artifactAppService.executeCodeTask(taskIdentifier)
  });
}
