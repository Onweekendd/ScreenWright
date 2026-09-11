import { AppCodeTaskError } from "../../contracts/app-code-task-error";
import type { AppSandbox } from "../../sandbox/app-sandbox";
import { SandboxAcquisitionError, type SandboxManager } from "../../sandbox/sandbox-manager";
import {
  type AppDevelopmentPreview,
  createArtifactAppPreviewPath,
  PreviewError,
  type PreviewManager
} from "../preview-manager";
import { createTempDirPreviewPidfile, type PreviewPidfile } from "./preview-pidfile";
import {
  type StartViteDevelopmentServer,
  startViteDevelopmentServer,
  type ViteDevelopmentServerProcess
} from "./vite-development-server";

export interface LocalPreviewManagerOptions {
  readonly sandboxManager: SandboxManager;
  readonly startDevelopmentServer?: StartViteDevelopmentServer;
  /** pidfile 读写与孤儿预览进程回收；默认使用系统临时目录实现，测试可注入替身。 */
  readonly pidfile?: PreviewPidfile;
}

interface ManagedPreview {
  readonly preview: AppDevelopmentPreview;
  readonly process: ViteDevelopmentServerProcess;
  readonly sandbox: AppSandbox;
  released: boolean;
}

/** 管理当前 Screenwright 实例中所有本地 Vite 开发服务器及其 App 映射。 */
export class LocalPreviewManager implements PreviewManager {
  private readonly sandboxManager: SandboxManager;
  private readonly startDevelopmentServer: StartViteDevelopmentServer;
  private readonly pidfile: PreviewPidfile;
  private readonly previews = new Map<string, ManagedPreview>();
  private readonly startingPreviews = new Map<string, Promise<AppDevelopmentPreview>>();

  constructor(options: LocalPreviewManagerOptions) {
    this.sandboxManager = options.sandboxManager;
    this.startDevelopmentServer = options.startDevelopmentServer ?? startViteDevelopmentServer;
    this.pidfile = options.pidfile ?? createTempDirPreviewPidfile();
  }

  async start(appId: string): Promise<AppDevelopmentPreview> {
    const current = this.previews.get(appId);
    if (current) {
      return current.preview;
    }

    let starting = this.startingPreviews.get(appId);
    if (!starting) {
      starting = this.startNewPreview(appId);
      this.startingPreviews.set(appId, starting);
    }

    try {
      return await starting;
    } finally {
      if (this.startingPreviews.get(appId) === starting) {
        this.startingPreviews.delete(appId);
      }
    }
  }

  get(appId: string): AppDevelopmentPreview | undefined {
    return this.previews.get(appId)?.preview;
  }

  async stop(appId: string): Promise<void> {
    const starting = this.startingPreviews.get(appId);
    if (starting) {
      await starting.catch(() => undefined);
    }

    const managedPreview = this.previews.get(appId);
    if (!managedPreview) {
      return;
    }

    await managedPreview.process.stop();
    await this.unregisterPreview(appId, managedPreview);
  }

  async stopAll(): Promise<void> {
    const appIds = new Set([...this.startingPreviews.keys(), ...this.previews.keys()]);
    await Promise.all([...appIds].map((appId) => this.stop(appId)));
  }

  /**
   * 启动新预览前先回收上一个 Screenwright 实例遗留的孤儿进程，再把当前进程的
   * PID 与端口写入 pidfile，保证进程被强杀后下一个实例仍能完成回收。
   */
  private async startNewPreview(appId: string): Promise<AppDevelopmentPreview> {
    let sandbox: AppSandbox | undefined;

    try {
      sandbox = await this.sandboxManager.acquire(appId);
      await this.pidfile.terminateStale(appId);
      const publicPath = createArtifactAppPreviewPath(appId);
      const process = await this.startDevelopmentServer({
        appId,
        workspacePath: sandbox.workspacePath,
        publicPath
      });
      const managedPreview: ManagedPreview = {
        preview: { appId, port: process.port, publicPath, status: "running" },
        process,
        sandbox,
        released: false
      };

      await this.registerPreview(appId, managedPreview);
      void process.closed.then(() => this.handleUnexpectedExit(appId, managedPreview));
      return managedPreview.preview;
    } catch (error) {
      if (sandbox) {
        await this.sandboxManager.release(sandbox);
      }
      throw toPreviewError(appId, error);
    }
  }

  private async handleUnexpectedExit(appId: string, managedPreview: ManagedPreview): Promise<void> {
    await this.unregisterPreview(appId, managedPreview);
  }

  /** 登记新预览：写入内存映射并持久化 PID，供进程重启后回收孤儿。 */
  private async registerPreview(appId: string, managedPreview: ManagedPreview): Promise<void> {
    this.previews.set(appId, managedPreview);
    await this.pidfile.save(appId, {
      pid: managedPreview.process.pid,
      port: managedPreview.process.port
    });
  }

  /**
   * 注销预览：从内存映射移除（仅当仍是当前记录时）、清理 pidfile 并释放沙箱。
   *
   * 主动停止与进程意外退出共用此入口，保证两处的清理行为始终一致。
   */
  private async unregisterPreview(appId: string, managedPreview: ManagedPreview): Promise<void> {
    if (this.previews.get(appId) === managedPreview) {
      this.previews.delete(appId);
    }
    await this.pidfile.clear(appId);
    await this.releaseSandbox(managedPreview);
  }

  private async releaseSandbox(managedPreview: ManagedPreview): Promise<void> {
    if (managedPreview.released) {
      return;
    }
    managedPreview.released = true;
    await this.sandboxManager.release(managedPreview.sandbox);
  }
}

function toPreviewError(appId: string, error: unknown): PreviewError {
  if (error instanceof PreviewError) {
    return error;
  }
  if (error instanceof SandboxAcquisitionError) {
    return new PreviewError(error.code, error.message, { cause: error });
  }
  return new PreviewError(AppCodeTaskError.SANDBOX_UNAVAILABLE, `Failed to start preview for App: ${appId}`, {
    cause: error
  });
}
