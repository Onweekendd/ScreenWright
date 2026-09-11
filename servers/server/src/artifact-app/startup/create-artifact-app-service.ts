import { type CreateModelRuntimeOptions, getAgentDir } from "@earendil-works/pi-coding-agent";

import { PiAgentRunner } from "../agent/pi-agent-runner";
import { createPiModelRuntime } from "../agent/runtime/pi-model-runtime";
import { PiSessionFactory } from "../agent/sessions/pi-session-factory";
import { InMemoryAppWriteLock } from "../application/app-write-lock";
import { ArtifactAppService } from "../application/artifact-app-service";
import { LocalPreviewManager } from "../preview/local/local-preview-manager";
import { LocalSandboxManager } from "../sandbox/local/local-sandbox-manager";

export interface CreateArtifactAppServiceOptions {
  /** 推理模型 API Key（ai_model 表 reasoning 行），由最外层启动配置读取后注入。 */
  readonly apiKey: string;

  /** 推理模型自定义 endpoint；省略时用 Pi 内置 deepseek provider 的默认地址。 */
  readonly baseUrl?: string;

  /** 推理模型 id；Pi 不认识时回退内置 deepseek-v4-flash。 */
  readonly modelId?: string;

  /** 所有 Artifact App 项目的受信任父目录。 */
  readonly appsRoot: string;

  /** Pi Session 持久化数据的根目录。 */
  readonly sessionsRoot: string;

  /** 与 Mastra Task Tool 共用的任务存储根目录。 */
  readonly taskStorageRoot: string;

  /** Pi 全局配置目录；省略时使用 Pi SDK 的默认目录。 */
  readonly agentDir?: string;

  /** Pi ModelRuntime 的可选创建参数。 */
  readonly modelRuntimeOptions?: CreateModelRuntimeOptions;
}

export interface ArtifactAppRuntime {
  readonly artifactAppService: ArtifactAppService;
  readonly previewManager: LocalPreviewManager;
}

/**
 * 在应用启动层组装 Artifact App 的具体运行依赖。
 *
 * 只有这个组合根知道 LocalSandbox、Pi SDK 和应用服务的具体实现，Mastra Tool
 * 只接收最终的 ArtifactAppService，不直接创建或管理这些对象。
 */
export async function createArtifactAppService(options: CreateArtifactAppServiceOptions): Promise<ArtifactAppService> {
  return (await createArtifactAppRuntime(options)).artifactAppService;
}

/** 创建共享同一个 SandboxManager 的代码执行服务和开发预览管理器。 */
export async function createArtifactAppRuntime(options: CreateArtifactAppServiceOptions): Promise<ArtifactAppRuntime> {
  const { modelRuntime, model } = await createPiModelRuntime({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    modelId: options.modelId,
    runtimeOptions: options.modelRuntimeOptions
  });
  const piSessionFactory = new PiSessionFactory({
    agentDir: resolveAgentDir(options.agentDir),
    sessionsRoot: options.sessionsRoot,
    modelRuntime,
    model
  });

  const sandboxManager = new LocalSandboxManager({ appsRoot: options.appsRoot });
  const artifactAppService = new ArtifactAppService({
    taskStorageRoot: options.taskStorageRoot,
    sandboxManager,
    piSessionFactory,
    piAgentRunner: new PiAgentRunner(),
    appWriteLock: new InMemoryAppWriteLock()
  });

  return {
    artifactAppService,
    previewManager: new LocalPreviewManager({ sandboxManager })
  };
}

function resolveAgentDir(agentDir: string | undefined): string {
  return agentDir?.trim() ? agentDir : getAgentDir();
}
