import path from "node:path";

import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import {
  type AgentSession,
  createAgentSession,
  type CreateAgentSessionOptions,
  type ModelRuntime,
  SessionManager
} from "@earendil-works/pi-coding-agent";

import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";

import type { PiAgentRunnerSession } from "../pi-agent-runner";
import { createPiResourceLoader } from "../resources/pi-resource-loader";
import { createSandboxBashTool } from "../tools/sandbox-bash-tool";

type PiModel = NonNullable<CreateAgentSessionOptions["model"]>;

export enum PiBuiltInTool {
  Read = "read",
  Bash = "bash",
  Edit = "edit",
  Write = "write",
  Grep = "grep",
  Find = "find",
  List = "ls"
}

export interface PiSessionFactoryOptions {
  /** Pi 的全局资源目录，由应用启动层注入。 */
  readonly agentDir: string;

  /** Pi Session 文件的持久化根目录，由应用启动层注入。 */
  readonly sessionsRoot: string;

  /** 所有 Pi Session 共享的模型运行环境。 */
  readonly modelRuntime: ModelRuntime;

  /** 新建 Pi Session 时使用的模型。 */
  readonly model: PiModel;

  /** 可选的 Pi 内置工具白名单；不传时使用 Pi 的默认工具。 */
  readonly builtInTools?: readonly PiBuiltInTool[];

  /** 注入给 Pi Session 的自定义工具。 */
  readonly customTools?: ToolDefinition[];
}

export interface GetOrCreatePiSessionInput {
  /** 已经由 SandboxManager 获取并完成路径校验的 Sandbox。 */
  readonly sandbox: AppSandbox;

  /** 主会话对应的任务列表 ID，与 appId 共同确定 Pi Session。 */
  readonly taskListId: string;
}

/** 按任务列表获取或复用 Pi Agent 会话的工厂抽象。 */
export interface ArtifactAppPiSessionFactory {
  /** 获取指定沙箱与任务列表对应的 Pi Agent 会话；不存在时创建新会话。 */
  getOrCreate(input: GetOrCreatePiSessionInput): Promise<PiAgentRunnerSession>;
}

export interface ResolvePiSessionDirectoryInput {
  readonly sessionsRoot: string;
  readonly appId: string;
  readonly taskListId: string;
}

/**
 * 根据业务标识解析 Pi Session 的持久化目录。
 *
 * appId 和 taskListId 会先编码成安全的单个路径片段，避免外部标识逃出
 * sessionsRoot。Session 文件不会写入 App 源码工作目录。
 */
export function resolvePiSessionDirectory(input: ResolvePiSessionDirectoryInput): string {
  const { sessionsRoot, appId, taskListId } = input;

  return path.join(
    path.resolve(sessionsRoot),
    `app-${encodePathSegment(appId, "appId")}`,
    `task-list-${encodePathSegment(taskListId, "taskListId")}`
  );
}

/**
 * 按 appId 与 taskListId 创建并复用 Pi Agent Session。
 *
 * 工厂不负责创建 Sandbox，只使用调用方传入的 Sandbox 工作目录。相同业务 key
 * 在当前进程中共享同一个 AgentSession；进程重启后从对应的持久化目录恢复最近会话。
 */
export class PiSessionFactory {
  private readonly agentDir: string;
  private readonly sessionsRoot: string;
  private readonly modelRuntime: ModelRuntime;
  private readonly model: PiModel;
  private readonly builtInTools?: PiBuiltInTool[];
  private readonly customTools?: ToolDefinition[];
  private readonly sessions = new Map<string, Promise<AgentSession>>();

  constructor(options: PiSessionFactoryOptions) {
    this.agentDir = path.resolve(options.agentDir);
    this.sessionsRoot = path.resolve(options.sessionsRoot);
    this.modelRuntime = options.modelRuntime;
    this.model = options.model;
    this.builtInTools = options.builtInTools === undefined ? undefined : [...options.builtInTools];
    this.customTools = options.customTools === undefined ? undefined : [...options.customTools];
  }

  /**
   * 获取已有 Session，或在不存在时创建并缓存一个 Session。
   */
  async getOrCreate(input: GetOrCreatePiSessionInput): Promise<AgentSession> {
    const sessionKey = createSessionKey(input.sandbox.appId, input.taskListId);
    const existingSession = this.sessions.get(sessionKey);

    if (existingSession) {
      return existingSession;
    }

    const sessionPromise = this.createSessionForSandboxApp(input);
    this.sessions.set(sessionKey, sessionPromise);

    try {
      return await sessionPromise;
    } catch (error: unknown) {
      if (this.sessions.get(sessionKey) === sessionPromise) {
        this.sessions.delete(sessionKey);
      }

      throw error;
    }
  }

  /**
   * 为已经准备好的 Sandbox 创建或恢复 Pi Session。
   */
  private async createSessionForSandboxApp(input: GetOrCreatePiSessionInput): Promise<AgentSession> {
    const { sandbox, taskListId } = input;
    const sessionDirectory = resolvePiSessionDirectory({
      sessionsRoot: this.sessionsRoot,
      appId: sandbox.appId,
      taskListId
    });
    const sessionManager = SessionManager.continueRecent(sandbox.workspacePath, sessionDirectory);
    const resourceLoader = await createPiResourceLoader({
      workspacePath: sandbox.workspacePath,
      agentDir: this.agentDir
    });
    const customTools = this.createCustomTools(sandbox);
    const tools = this.createToolAllowlist(customTools);
    const { session } = await createAgentSession({
      cwd: sandbox.workspacePath,
      modelRuntime: this.modelRuntime,
      model: this.model,
      sessionManager,
      resourceLoader,
      tools,
      customTools
    });

    return session;
  }

  /**
   * 组装当前 Sandbox 使用的自定义工具，并让 Sandbox Bash 覆盖 Pi 内置 Bash。
   */
  private createCustomTools(sandbox: AppSandbox): ToolDefinition[] {
    return [...(this.customTools ?? []), createSandboxBashTool(sandbox)];
  }

  private createToolAllowlist(customTools: readonly ToolDefinition[]): string[] | undefined {
    if (this.builtInTools === undefined) {
      return undefined;
    }

    return [...new Set([...this.builtInTools, ...customTools.map((tool) => tool.name)])];
  }
}

function createSessionKey(appId: string, taskListId: string): string {
  return JSON.stringify([appId, taskListId]);
}

function encodePathSegment(value: string, name: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty`);
  }

  return Buffer.from(value, "utf8").toString("base64url");
}
