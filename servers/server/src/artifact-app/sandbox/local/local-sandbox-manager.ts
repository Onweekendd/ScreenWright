import { lstat, mkdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

import { AppCodeTaskError } from "../../contracts/app-code-task-error";
import type { AppSandbox } from "../app-sandbox";
import { SandboxAcquisitionError, type SandboxManager } from "../sandbox-manager";
import { initializeLocalAppProject, type LocalAppProjectInitializer } from "./local-app-project-initializer";
import { LocalSandbox } from "./local-sandbox";

const APP_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export interface LocalSandboxManagerOptions {
  /** 所有本地 Artifact App 项目的受信任根目录。 */
  readonly appsRoot: string;

  /** 项目不存在时使用的初始化函数。 */
  readonly initializeAppProject?: LocalAppProjectInitializer;
}

export class LocalSandboxManager implements SandboxManager {
  private readonly appsRoot: string;
  private readonly initializeAppProject: LocalAppProjectInitializer;
  private readonly initializingApps = new Map<string, Promise<void>>();

  constructor(options: LocalSandboxManagerOptions) {
    this.appsRoot = path.resolve(options.appsRoot);
    this.initializeAppProject = options.initializeAppProject ?? initializeLocalAppProject;
  }

  async acquire(appId: string): Promise<AppSandbox> {
    if (!APP_ID_PATTERN.test(appId)) {
      throw this.appNotFound(appId);
    }

    const realAppsRoot = await this.ensureAppsRoot();
    let realWorkspacePath = await this.resolveWorkspace({ appId, realAppsRoot });

    if (!realWorkspacePath) {
      await this.initializeMissingApp({ appId, realAppsRoot });
      realWorkspacePath = await this.resolveWorkspace({ appId, realAppsRoot });
    }

    if (!realWorkspacePath) {
      throw new SandboxAcquisitionError(
        AppCodeTaskError.SANDBOX_UNAVAILABLE,
        `App initialization completed without creating a workspace: ${appId}`
      );
    }

    return new LocalSandbox(appId, realWorkspacePath);
  }

  async release(_sandbox: AppSandbox): Promise<void> {
    // LocalSandbox does not hold a container or lease that needs releasing.
  }

  private async ensureAppsRoot(): Promise<string> {
    try {
      await mkdir(this.appsRoot, { recursive: true });
      return await realpath(this.appsRoot);
    } catch (error) {
      throw new SandboxAcquisitionError(AppCodeTaskError.SANDBOX_UNAVAILABLE, "Local apps root is unavailable", {
        cause: error
      });
    }
  }

  private async resolveWorkspace(input: { appId: string; realAppsRoot: string }): Promise<string | undefined> {
    const workspacePath = path.join(input.realAppsRoot, input.appId);

    try {
      await lstat(workspacePath);
    } catch (error) {
      if (isMissingPathError(error)) {
        return undefined;
      }
      throw this.appNotFound(input.appId, error);
    }

    try {
      const realWorkspacePath = await realpath(workspacePath);
      const workspaceStats = await stat(realWorkspacePath);
      if (!workspaceStats.isDirectory() || !isPathInside(input.realAppsRoot, realWorkspacePath)) {
        throw this.appNotFound(input.appId);
      }
      return realWorkspacePath;
    } catch (error) {
      if (error instanceof SandboxAcquisitionError) {
        throw error;
      }
      throw this.appNotFound(input.appId, error);
    }
  }

  private async initializeMissingApp(input: { appId: string; realAppsRoot: string }): Promise<void> {
    let initialization = this.initializingApps.get(input.appId);
    if (!initialization) {
      initialization = this.initializeAppProject({
        workspacePath: path.join(input.realAppsRoot, input.appId)
      });
      this.initializingApps.set(input.appId, initialization);
    }

    try {
      await initialization;
    } catch (error) {
      throw new SandboxAcquisitionError(
        AppCodeTaskError.SANDBOX_UNAVAILABLE,
        `Failed to initialize Artifact App: ${input.appId}`,
        { cause: error }
      );
    } finally {
      if (this.initializingApps.get(input.appId) === initialization) {
        this.initializingApps.delete(input.appId);
      }
    }
  }

  private appNotFound(appId: string, cause?: unknown) {
    return new SandboxAcquisitionError(
      AppCodeTaskError.APP_NOT_FOUND,
      `App does not exist or is unavailable: ${appId}`,
      cause === undefined ? undefined : { cause }
    );
  }
}

function isMissingPathError(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

function isPathInside(parentPath: string, candidatePath: string) {
  const relativePath = path.relative(parentPath, candidatePath);
  return (
    relativePath.length > 0 &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}
